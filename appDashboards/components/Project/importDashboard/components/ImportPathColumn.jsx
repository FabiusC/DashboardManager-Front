import React from 'react';
import { Box, CircularProgress, Stack, Typography } from '@mui/material';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import ImportPathSearchField from './ImportPathSearchField';

const BORDER_LIGHT = '#E2E5EB';
const COLUMN_BG = '#FAFBFD';
const OPTION_BG = '#FFFFFF';
const SELECTED_BG = '#E5EDFA';

const MAX_VISIBLE_OPTION_ROWS = 4;
const OPTION_ROW_HEIGHT_PX = 40;
const OPTION_STACK_GAP_PX = 4;

const listScrollMaxHeightPx =
    MAX_VISIBLE_OPTION_ROWS * OPTION_ROW_HEIGHT_PX + (MAX_VISIBLE_OPTION_ROWS - 1) * OPTION_STACK_GAP_PX;
export default function ImportPathColumn({
    title,
    icon: Icon,
    options = [],
    selectedId,
    onSelect,
    loading = false,
    disabled = false,
    fillHeight = false,
    getSecondaryText,
    emptyHint,
    searchValue = '',
    onSearchChange,
    searchPlaceholder
}) {
    return (
        <Box
            sx={{
                flex: 1,
                minWidth: 0,
                maxHeight: fillHeight ? 240 : undefined,
                display: 'flex',
                flexDirection: 'column',
                border: `1px solid ${BORDER_LIGHT}`,
                borderRadius: 2,
                overflow: 'hidden',
                bgcolor: COLUMN_BG,
                pointerEvents: disabled ? 'none' : 'auto'
            }}
        >
            <Box
                sx={{
                    px: 1.25,
                    py: 0.85,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    bgcolor: COLUMN_BG
                }}
            >
                <Icon
                    sx={{
                        fontSize: 16,
                        color: disabled ? 'action.disabled' : 'primary.main'
                    }}
                />
                <Typography
                    variant="caption"
                    sx={{
                        fontWeight: 400,
                        letterSpacing: '0.07em',
                        textTransform: 'uppercase',
                        color: disabled ? 'action.disabled' : 'text.secondary'
                    }}
                >
                    {title}
                </Typography>
            </Box>

            {onSearchChange ? (
                <Box sx={{ px: 1, pt: 0.65, pb: 0.4, bgcolor: COLUMN_BG }}>
                    <ImportPathSearchField
                        value={searchValue}
                        onChange={onSearchChange}
                        placeholder={searchPlaceholder || `Buscar ${title.toLowerCase()}…`}
                        disabled={disabled}
                    />
                </Box>
            ) : null}

            <Box
                sx={{
                    overflowY: 'auto',
                    maxHeight: fillHeight ? 176 : listScrollMaxHeightPx,
                    flex: fillHeight ? '1 1 auto' : undefined,
                    minHeight: fillHeight ? 0 : undefined,
                    p: 1,
                    pt: onSearchChange ? 0.4 : 1,
                    bgcolor: COLUMN_BG
                }}
            >
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                        <CircularProgress size={22} sx={{ color: disabled ? 'action.disabled' : 'primary.main' }} />
                    </Box>
                ) : options.length === 0 ? (
                    <Box sx={{ py: 2.25, px: 1.25, textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ fontWeight: 400, color: 'text.disabled' }}>
                            {emptyHint || 'Sin resultados'}
                        </Typography>
                    </Box>
                ) : (
                    <Stack spacing={0.5}>
                        {options.map((opt) => {
                            const selected = String(opt.id) === String(selectedId);
                            const secondary = getSecondaryText ? getSecondaryText(opt) : opt.subtitle;

                            return (
                                <Box
                                    key={String(opt.id)}
                                    component="button"
                                    type="button"
                                    onClick={() => onSelect(opt)}
                                    sx={{
                                        width: '100%',
                                        textAlign: 'left',
                                        border: selected ? '1px solid' : 'none',
                                        borderColor: selected ? 'primary.main' : 'transparent',
                                        boxShadow: 'none',
                                        outline: 'none',
                                        borderRadius: 2.5,
                                        py: 0.65,
                                        px: 1,
                                        cursor: 'pointer',
                                        bgcolor: selected ? SELECTED_BG : OPTION_BG,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: 0.75,
                                        minHeight: OPTION_ROW_HEIGHT_PX,
                                        transition: 'background-color 150ms ease, border-color 150ms ease',
                                        ...(!selected
                                            ? {
                                                  '&:hover': {
                                                      bgcolor: '#F7F8FA'
                                                  }
                                              }
                                            : {}),
                                        '&:focus-visible': {
                                            outline: '2px solid',
                                            outlineColor: 'primary.main',
                                            outlineOffset: 2
                                        }
                                    }}
                                >
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                fontWeight: 500,
                                                fontSize: '0.8125rem',
                                                color: 'text.primary',
                                                lineHeight: 1.25
                                            }}
                                        >
                                            {opt.label}
                                        </Typography>
                                        {secondary ? (
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    fontWeight: 500,
                                                    fontSize: '0.6875rem',
                                                    color: 'text.secondary',
                                                    display: 'block',
                                                    mt: 0.125
                                                }}
                                            >
                                                {secondary}
                                            </Typography>
                                        ) : null}
                                    </Box>
                                    {selected ? (
                                        <CheckRoundedIcon
                                            sx={{ fontSize: 17, color: 'primary.main', flexShrink: 0 }}
                                        />
                                    ) : null}
                                </Box>
                            );
                        })}
                    </Stack>
                )}
            </Box>
        </Box>
    );
}
