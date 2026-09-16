import Grid from "@mui/material/Grid";
import TextField from "../UIElements/TextField";

export const PersonDataCard = ({ person, handleChange }) => {
  const safePerson = person && typeof person === 'object' ? person : {};
  return (
    <Grid container spacing={1}>
      <TextField
        gsize={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}
        id="first_name"
        label="First name"
        handleChange={handleChange}
        value={safePerson.first_name ?? ''}
      />
      <TextField
        gsize={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}
        id="middle_name"
        label="Middle name"
        handleChange={handleChange}
        value={safePerson.middle_name ?? ''}
      />
      <TextField
        gsize={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}
        id="last_name"
        label="Last name"
        handleChange={handleChange}
        value={safePerson.last_name ?? ''}
      />
      <TextField
        gsize={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}
        id="phone"
        label="Phone"
        handleChange={handleChange}
        value={safePerson.phone ?? ''}
      />
      <TextField
        gsize={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}
        id="email"
        label="Email"
        handleChange={handleChange}
        value={safePerson.email ?? ''}
      />
      <TextField
        gsize={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}
        id="remarks"
        label="Remarks"
        handleChange={handleChange}
        value={safePerson.remarks ?? ''}
      />
    </Grid>
  )
};