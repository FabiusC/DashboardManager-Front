import { InputAdornment, TextField } from "@mui/material";
import { Search } from "@mui/icons-material";

const DashboardIndexSearch = ({
  value,
  onChange,
  placeholder = "Escriba para buscar un tablero",
}) => (
  <TextField
    fullWidth
    variant="outlined"
    placeholder={placeholder}
    size="small"
    value={value}
    onChange={(event) => onChange(event.target.value)}
    InputProps={{
      startAdornment: (
        <InputAdornment position="start">
          <Search sx={{ fontSize: "1.125rem", color: "text.secondary" }} />
        </InputAdornment>
      ),
    }}
    sx={{
      "& .MuiOutlinedInput-root": {
        borderRadius: "10px",
        bgcolor: "#fff",
        fontSize: "0.875rem",
        "& fieldset": { borderColor: "#E2E8F0" },
        "&:hover fieldset": { borderColor: "#CBD5E1" },
        "&.Mui-focused fieldset": { borderColor: "#E2E8F0", borderWidth: "1px" },
      },
    }}
  />
);

export default DashboardIndexSearch;
