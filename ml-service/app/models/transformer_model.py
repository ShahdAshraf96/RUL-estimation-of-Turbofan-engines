import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
import joblib
import os
from typing import Optional, Tuple

class GatedConvUnit(nn.Module):
    def __init__(self, input_dim, output_dim, kernel_size=3):
        super(GatedConvUnit, self).__init__()
        self.conv = nn.Conv1d(input_dim, output_dim, kernel_size, padding=kernel_size // 2)
        self.gate = nn.Conv1d(input_dim, output_dim, kernel_size, padding=kernel_size // 2)

    def forward(self, x):
        # x: (batch_size, sequence_length, input_dim)
        # Conv1d expects (batch_size, input_dim, sequence_length)
        x = x.permute(0, 2, 1) 
        
        conv_out = self.conv(x)
        gate_out = torch.sigmoid(self.gate(x))
        
        # Permute back to (batch_size, sequence_length, output_dim)
        return (conv_out * gate_out).permute(0, 2, 1)

class MultiHeadAttention(nn.Module):
    def __init__(self, embed_dim, num_heads):
        super(MultiHeadAttention, self).__init__()
        self.embed_dim = embed_dim
        self.num_heads = num_heads
        self.head_dim = embed_dim // num_heads
        assert self.head_dim * num_heads == self.embed_dim, "embed_dim must be divisible by num_heads"

        self.wq = nn.Linear(embed_dim, embed_dim)
        self.wk = nn.Linear(embed_dim, embed_dim)
        self.wv = nn.Linear(embed_dim, embed_dim)
        self.dense = nn.Linear(embed_dim, embed_dim)

    def split_heads(self, x, batch_size):
        x = x.view(batch_size, -1, self.num_heads, self.head_dim)
        return x.permute(0, 2, 1, 3) # (batch_size, num_heads, seq_len, head_dim)

    def forward(self, q, k, v, mask=None):
        batch_size = q.size(0)

        q = self.wq(q)
        k = self.wk(k)
        v = self.wv(v)

        q = self.split_heads(q, batch_size)
        k = self.split_heads(k, batch_size)
        v = self.split_heads(v, batch_size)

        # Scaled dot-product
        matmul_qk = torch.matmul(q, k.permute(0, 1, 3, 2))
        dk = torch.tensor(self.head_dim, dtype=torch.float32)
        scaled_attention_logits = matmul_qk / torch.sqrt(dk)

        if mask is not None:
            scaled_attention_logits += (mask * -1e9)

        attention_weights = F.softmax(scaled_attention_logits, dim=-1)
        output = torch.matmul(attention_weights, v)

        output = output.permute(0, 2, 1, 3).contiguous()
        output = output.view(batch_size, -1, self.embed_dim)

        return self.dense(output), attention_weights

class FeedForwardNetwork(nn.Module):
    def __init__(self, embed_dim, dff):
        super(FeedForwardNetwork, self).__init__()
        self.linear1 = nn.Linear(embed_dim, dff)
        self.linear2 = nn.Linear(dff, embed_dim)

    def forward(self, x):
        return self.linear2(F.relu(self.linear1(x)))

class EncoderLayer(nn.Module):
    def __init__(self, embed_dim, num_heads, dff, rate=0.1):
        super(EncoderLayer, self).__init__()
        self.mha = MultiHeadAttention(embed_dim, num_heads)
        self.ffn = FeedForwardNetwork(embed_dim, dff)

        self.layernorm1 = nn.LayerNorm(embed_dim)
        self.layernorm2 = nn.LayerNorm(embed_dim)

        self.dropout1 = nn.Dropout(rate)
        self.dropout2 = nn.Dropout(rate)

    def forward(self, x, mask=None):
        attn_output, _ = self.mha(x, x, x, mask) # Self-attention
        attn_output = self.dropout1(attn_output)
        out1 = self.layernorm1(x + attn_output) # Add & Norm

        ffn_output = self.ffn(out1)
        ffn_output = self.dropout2(ffn_output)
        out2 = self.layernorm2(out1 + ffn_output) # Add & Norm

        return out2

class TransformerRUL(nn.Module):

    def __init__(self, input_dim, embed_dim, num_layers, num_heads, dff, rate=0.1, max_rul=125):
        super(TransformerRUL, self).__init__()
        self.input_dim = input_dim
        self.embed_dim = embed_dim
        self.max_rul = max_rul

        # Local Feature Extraction Layer
        self.gcu = GatedConvUnit(input_dim, embed_dim)
        self.linear_gcu = nn.Linear(embed_dim, embed_dim)

        self.pos_encoding = self.positional_encoding(1000, embed_dim)

        # Encoder Layers
        self.encoder_layers = nn.ModuleList([
            EncoderLayer(embed_dim, num_heads, dff, rate) 
            for _ in range(num_layers)
        ])

        # Regression Layer
        self.regression_linear = nn.Linear(embed_dim, 1)
        self.sigmoid = nn.Sigmoid()

    def positional_encoding(self, position, d_model):
        angle_rads = self.get_angles(torch.arange(position).unsqueeze(1), 
                                     torch.arange(d_model).unsqueeze(0), 
                                     d_model)
        
        angle_rads[:, 0::2] = torch.sin(angle_rads[:, 0::2])

        angle_rads[:, 1::2] = torch.cos(angle_rads[:, 1::2])
        
        pos_encoding = angle_rads.unsqueeze(0)
        return pos_encoding

    def get_angles(self, pos, i, d_model):
        angle_rates = 1 / torch.pow(10000, (2 * (i // 2)) / torch.tensor(d_model, dtype=torch.float32))
        return pos * angle_rates

    def forward(self, x, mask=None):

        x = self.gcu(x) # (batch_size, sequence_length, embed_dim)
        x = self.linear_gcu(x)
        
        # Add positional encoding
        seq_len = x.size(1)
        x += self.pos_encoding[:, :seq_len, :].to(x.device)

        # Encoder Layers
        for encoder_layer in self.encoder_layers:
            x = encoder_layer(x, mask)

        x = torch.mean(x, dim=1) # (batch_size, embed_dim)
        
        output = self.regression_linear(x)
        output = self.sigmoid(output) * self.max_rul # Scale sigmoid output to max_rul

        return output

def load_model(model_path: str, device: torch.device) -> TransformerRUL:
    try:
        model = TransformerRUL(
            input_dim=16,     
            embed_dim=64,     
            num_layers=2,     
            num_heads=4,      
            dff=128,          
            rate=0.1,         
            max_rul=125       
        )
        
        checkpoint = torch.load(model_path, map_location=device)
        
        if isinstance(checkpoint, dict):
            if 'model_state_dict' in checkpoint:
                model.load_state_dict(checkpoint['model_state_dict'])
            elif 'state_dict' in checkpoint:
                model.load_state_dict(checkpoint['state_dict'])
            else:
                model.load_state_dict(checkpoint)
        else:
            # Direct state dict
            model.load_state_dict(checkpoint)
        
        model.to(device)
        model.eval()
        
        return model
        
    except Exception as e:
        print(f"Failed to load model: {e}")
        raise

def load_scaler(scaler_path: str):
    try:
        if scaler_path.endswith('.pkl'):
            scaler = joblib.load(scaler_path)
        else:
            import pickle
            with open(scaler_path, 'rb') as f:
                scaler = pickle.load(f)
        
        
        return scaler
        
    except Exception as e:
        print(f"Failed to load scaler: {e}")
        raise

TransformerRULModel = TransformerRUL

