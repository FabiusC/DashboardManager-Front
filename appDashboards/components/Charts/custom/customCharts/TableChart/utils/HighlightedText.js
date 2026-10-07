import React from "react";
import { Box } from "@mui/material";

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export function HighlightedText({ text, query, highlightColor }) {
  const stringText = text == null ? "" : String(text);
  const trimmedQuery = String(query ?? "").trim();
  if (!trimmedQuery || !stringText) {
    return stringText;
  }

  const tokens = trimmedQuery
    .split(/\s+/)
    .filter(Boolean)
    .map(escapeRegExp);

  if (tokens.length === 0) {
    return stringText;
  }

  const splitRegex = new RegExp(`(${tokens.join("|")})`, "gi");
  const matchRegex = new RegExp(`^(?:${tokens.join("|")})$`, "i");
  const parts = stringText.split(splitRegex).filter((part) => part !== "");

  return (
    <span>
      {parts.map((part, index) =>
        matchRegex.test(part) ? (
          <Box
            component="span"
            key={`${part}-${index}`}
            sx={{
              backgroundColor: highlightColor,
              borderRadius: "2px",
              padding: "0 1px",
            }}
          >
            {part}
          </Box>
        ) : (
          <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
        )
      )}
    </span>
  );
}

export default HighlightedText;
