export const WIZARD_FOOTER_WRAPPER_SX = {
    flexShrink: 0,
    width: '100%',
    pt: 2,
    pb: 4,
    boxSizing: 'border-box'
};

export const WIZARD_FOOTER_WRAPPER_COMPACT_SX = {
    ...WIZARD_FOOTER_WRAPPER_SX,
    pt: 1.5,
    pb: 4
};

export const WIZARD_FOOTER_LAYOUT_SX = {
    width: '100%',
    minWidth: 0,
    display: 'flex',
    flexDirection: { xs: 'column-reverse', sm: 'row' },
    alignItems: { xs: 'stretch', sm: 'center' },
    justifyContent: 'space-between',
    gap: 1.5,
    flexShrink: 0
};

export const WIZARD_BACK_BUTTON_SX = {
    minWidth: 148,
    height: 40,
    borderRadius: 2,
    textTransform: 'none',
    fontWeight: 600,
    borderColor: 'divider',
    color: 'text.secondary',
    px: 2.25,
    py: 0.875,
    boxSizing: 'border-box'
};

export const WIZARD_CONTINUE_BUTTON_SX = {
    minWidth: 148,
    height: 40,
    borderRadius: 2,
    textTransform: 'none',
    fontWeight: 600,
    px: 2.25,
    py: 0.875,
    boxShadow: 'none',
    boxSizing: 'border-box',
    '&:hover': { boxShadow: 'none' }
};
