import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';

// Apple-style stat tile: quiet uppercase caption, large tight-tracked figure
export const Tile = ({ title, value, size = { xs: 12, sm: 12, md: 12, lg: 12, xl: 12 } }) => {
  return (
    <Grid size={size}>
      <Card variant="outlined" sx={{ height: '100%' }}>
        <CardContent sx={{ py: 2 }}>
          <Typography
            sx={{
              fontSize: '0.6875rem',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'text.secondary',
              lineHeight: 1.4,
            }}
          >
            {title}
          </Typography>
          <Typography
            sx={{
              fontSize: '1.75rem',
              fontWeight: 700,
              letterSpacing: '-0.022em',
              lineHeight: 1.15,
              mt: 0.25,
            }}
          >
            {value}
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  )
}

export default Tile;
