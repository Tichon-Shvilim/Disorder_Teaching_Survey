import React from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, MenuItem, Box, IconButton } from '@mui/material';
import { Language as LanguageIcon } from '@mui/icons-material';

interface LanguageSwitcherProps {
  variant?: 'header' | 'signin';
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ variant = 'header' }) => {
  const { i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
    handleClose();
  };

  const currentLanguage = i18n.language === 'he' ? 'עברית' : 'English';

  // Different styles based on variant
  const isSignInVariant = variant === 'signin';

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <IconButton
        onClick={handleClick}
        color="inherit"
        size="small"
        sx={{ 
          ml: 1,
          mr: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          padding: '8px 12px',
          borderRadius: 2,
          transition: 'all 0.2s ease-in-out',
          color: isSignInVariant ? '#374151' : 'text.secondary',
          backgroundColor: isSignInVariant ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.04)',
          backdropFilter: isSignInVariant ? 'blur(10px)' : 'none',
          boxShadow: isSignInVariant ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
          '&:hover': {
            backgroundColor: isSignInVariant ? 'rgba(255, 255, 255, 1)' : '#f0f9ff',
            color: isSignInVariant ? '#1976d2' : '#1976d2',
            transform: 'translateY(-1px)',
            boxShadow: isSignInVariant ? '0 6px 8px -1px rgba(0, 0, 0, 0.15)' : 'none'
          },
          '&:focus': {
            outline: 'none',
            boxShadow: 'none'
          },
          '&.Mui-focusVisible': {
            outline: 'none',
            boxShadow: 'none'
          }
        }}
        disableRipple
      >
        <LanguageIcon fontSize="small" />
        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{currentLanguage}</span>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        sx={{
          '& .MuiPaper-root': {
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            minWidth: '120px',
            mt: 1,
          }
        }}
      >
        <MenuItem 
          onClick={() => changeLanguage('he')}
          selected={i18n.language === 'he'}
          sx={{
            fontSize: '14px',
            fontWeight: i18n.language === 'he' ? 600 : 400,
            padding: '12px 20px',
            '&:hover': {
              backgroundColor: '#f0f9ff',
            },
            '&.Mui-selected': {
              backgroundColor: '#e0f2fe',
              color: '#0369a1',
              '&:hover': {
                backgroundColor: '#bae6fd',
              }
            }
          }}
        >
          עברית
        </MenuItem>
        <MenuItem 
          onClick={() => changeLanguage('en')}
          selected={i18n.language === 'en'}
          sx={{
            fontSize: '14px',
            fontWeight: i18n.language === 'en' ? 600 : 400,
            padding: '12px 20px',
            '&:hover': {
              backgroundColor: '#f0f9ff',
            },
            '&.Mui-selected': {
              backgroundColor: '#e0f2fe',
              color: '#0369a1',
              '&:hover': {
                backgroundColor: '#bae6fd',
              }
            }
          }}
        >
          English
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default LanguageSwitcher;
