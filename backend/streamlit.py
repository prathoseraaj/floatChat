import streamlit as st
import plotly.graph_objects as go
import pandas as pd

# -------------------------
# Your raw sample data
# -------------------------
timestamps = ["2025-03-02 09:46:25"] * 10
salinity = [
    34.112000, 34.148998, 34.112000, 34.088001, 34.147999,
    34.158001, 34.118000, 34.098999, 34.095001, 34.141998
]

# Convert to DataFrame
df = pd.DataFrame({"timestamp": pd.to_datetime(timestamps), "salinity": salinity})

# -------------------------
# Streamlit App
# -------------------------
st.title("🌊 Salinity Visualization for March 2025")

# Create plot
fig = go.Figure()

fig.add_trace(go.Scatter(
    x=df["timestamp"],
    y=df["salinity"],
    mode="markers+lines",
    name="Salinity",
    marker=dict(size=10, color="blue", line=dict(width=1, color="DarkSlateGrey"))
))

# Layout styling
fig.update_layout(
    title="Salinity Data for March 2025 (10 Important Points)",
    xaxis_title="Timestamp",
    yaxis_title="Salinity (PSU)",
    plot_bgcolor="white",
    paper_bgcolor="white",
    hovermode="x unified"
)

# Show Plotly chart in Streamlit
st.plotly_chart(fig, use_container_width=True)

# Extra Insights
st.write(f"""
### Insights:
- This graph displays **{len(df)} salinity measurements** from **March 2, 2025**.  
- All readings share the same timestamp (`{df['timestamp'].iloc[0].strftime('%Y-%m-%d %H:%M:%S')}`).  
- Salinity values range from **{df['salinity'].min():.3f}** to **{df['salinity'].max():.3f}**,  
  showing slight variations at that specific moment.  
""")
