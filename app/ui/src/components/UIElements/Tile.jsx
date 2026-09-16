import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';

export const Tile = ({ title, value, size = { xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }, delta }) => {
  return (
    <Grid size={size}>
      <Card
        variant="outlined"
        sx={{
          height: '100%',
          '&:hover': { transform: 'translateY(-1px)' },
        }}
      >
        <CardContent sx={{ py: 1.75, px: 2 }}>
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
              fontSize: { xs: '1.55rem', md: '1.75rem' },
              fontWeight: 700,
              letterSpacing: '-0.022em',
              lineHeight: 1.15,
              mt: 0.25,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {value}
          </Typography>
          {delta && (
            <Typography sx={{ fontSize: '0.75rem', color: 'success.main', fontWeight: 500, mt: 0.25 }}>
              {delta}
            </Typography>
          )}
        </CardContent>
      </Card>
    </Grid>
  );
};

export default Tile;
