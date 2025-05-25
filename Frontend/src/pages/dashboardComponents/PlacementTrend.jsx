// PlacementTrend.js
import React from 'react';
import { Grid, Paper, Typography } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const PlacementTrend = ({ data }) => {
  const maxValue = React.useMemo(() => {
    if (!data || data.length === 0) {
      return 0; // Default max value if no data
    }
    return data.reduce((max, item) => {
      const placedValue = typeof item.Placed === 'number' ? item.Placed : 0;
      const totalValue = typeof item.Total === 'number' ? item.Total : 0;
      return Math.max(max, placedValue, totalValue);
    }, 0); 
  }, [data]);

  const yTicks = React.useMemo(() => {
    const safeMaxValue = Math.max(0, Math.ceil(maxValue));
    return Array.from({ length: safeMaxValue + 1 }, (_, i) => i);
  }, [maxValue]); 

  if (!data || data.length === 0) {
    return (
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 500, justifyContent: 'center', alignItems: 'center' }}>
          <Typography component="h2" variant="h6" color="primary" gutterBottom>
            Placement Trend
          </Typography>
          <Typography variant="body1" color="textSecondary">
            No data available for placement trend.
          </Typography>
        </Paper>
      </Grid>
    );
  }

  return (
    <Grid item xs={12} md={6}>
      <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 500 }}>
        <Typography component="h2" variant="h6" color="primary" gutterBottom>
          Placement Trend
        </Typography>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 15,    
              right: 20, 
              left: 0,   
              bottom: 30 
            }}
          >
            <XAxis
              dataKey="name"
              height={100}
              tick={{
                angle: -45,
                textAnchor: 'end',
                fontSize: 14, 
                dy: 5 
              }}
              interval={0}
              axisLine={true}
              tickLine={true}
            />
            <YAxis
              domain={[0, 'auto']} 
              allowDecimals={false}
              ticks={yTicks}
            />
            <Tooltip />
            <Legend wrapperStyle={{ paddingTop: '130px' }} /> {/* Add padding above legend */}
            <Bar dataKey="Placed" fill="#8884d8" />
            <Bar dataKey="Total" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </Paper>
    </Grid>
  );
};

export default PlacementTrend;