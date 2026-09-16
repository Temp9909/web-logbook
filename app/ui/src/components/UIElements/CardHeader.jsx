import MUICardHeader from '@mui/material/CardHeader';

export const CardHeader = ({ title, ...props }) => {
  return (
    <MUICardHeader
      title={title}
      sx={{ p: 0, mb: 1.25, minHeight: 34 }}
      slotProps={{
        title: {
          sx: {
            fontSize: '0.72rem',
            lineHeight: 1.3,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'text.secondary',
          },
        },
        action: { sx: { m: 0, alignSelf: 'center' } },
      }}
      {...props}
    />
  );
};

export default CardHeader;
