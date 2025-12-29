import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  Button,
  TextField,
  Chip,
  IconButton,
  Paper,
  Stack,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Palette as PaletteIcon,
} from '@mui/icons-material';
import type { GraphSettings } from './models/FormModels';

interface AnalyticsSettingsProps {
  graphSettings: GraphSettings;
  onChange: (settings: GraphSettings) => void;
}

const AnalyticsSettings: React.FC<AnalyticsSettingsProps> = ({
  graphSettings,
  onChange
}) => {
  const [localSettings, setLocalSettings] = useState<GraphSettings>(graphSettings);

  const updateSettings = useCallback((newSettings: GraphSettings) => {
    setLocalSettings(newSettings);
    onChange(newSettings);
  }, [onChange]);

  const addColorRange = () => {
    const newRange = {
      label: '',
      min: 0,
      max: 100,
      color: '#2196F3'
    };
    
    const newSettings = {
      ...localSettings,
      colorRanges: [...localSettings.colorRanges, newRange]
    };
    updateSettings(newSettings);
  };

  const updateColorRange = (index: number, field: string, value: string | number) => {
    const newRanges = [...localSettings.colorRanges];
    newRanges[index] = { ...newRanges[index], [field]: value };
    
    const newSettings = { ...localSettings, colorRanges: newRanges };
    updateSettings(newSettings);
  };

  const removeColorRange = (index: number) => {
    const newRanges = localSettings.colorRanges.filter((_, i) => i !== index);
    const newSettings = { ...localSettings, colorRanges: newRanges };
    updateSettings(newSettings);
  };

  const presetColorRanges = [
    {
      name: 'Traffic Light (3 levels)',
      ranges: [
        { label: 'Low', min: 0, max: 33, color: '#ef4444' },
        { label: 'Medium', min: 34, max: 66, color: '#fbbf24' },
        { label: 'High', min: 67, max: 100, color: '#10b981' }
      ]
    },
    {
      name: 'Performance (5 levels)',
      ranges: [
        { label: 'Poor', min: 0, max: 20, color: '#dc2626' },
        { label: 'Below Average', min: 21, max: 40, color: '#f59e0b' },
        { label: 'Average', min: 41, max: 60, color: '#eab308' },
        { label: 'Good', min: 61, max: 80, color: '#22c55e' },
        { label: 'Excellent', min: 81, max: 100, color: '#16a34a' }
      ]
    }
  ];

  const applyPreset = (preset: typeof presetColorRanges[0]) => {
    const newSettings = { ...localSettings, colorRanges: preset.ranges };
    updateSettings(newSettings);
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h6" gutterBottom>
        📊 Analytics Configuration
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Configure how your form data will be visualized in charts and reports.
      </Typography>

      {/* Color Ranges Section */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Score Color Ranges
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Define color coding for different score ranges in your analytics
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={addColorRange}
            size="small"
          >
            Add Range
          </Button>
        </Stack>

        {/* Preset Options */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Quick Presets:
          </Typography>
          <Stack direction="row" spacing={2}>
            {presetColorRanges.map((preset, index) => (
              <Button
                key={index}
                variant="outlined"
                size="small"
                onClick={() => applyPreset(preset)}
                startIcon={<PaletteIcon />}
              >
                {preset.name}
              </Button>
            ))}
          </Stack>
        </Box>

        {/* Color Ranges List */}
        {localSettings.colorRanges.length === 0 ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            No color ranges defined. Add some ranges to enable colored analytics visualization.
          </Alert>
        ) : (
          <Box>
            {localSettings.colorRanges.map((range, index) => (
              <Card key={index} variant="outlined" sx={{ mb: 2, p: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <TextField
                    label="Label"
                    value={range.label}
                    onChange={(e) => updateColorRange(index, 'label', e.target.value)}
                    size="small"
                    sx={{ flex: 1 }}
                    placeholder="e.g., Low, Medium, High"
                  />
                  <TextField
                    label="Min"
                    type="number"
                    value={range.min}
                    onChange={(e) => updateColorRange(index, 'min', parseInt(e.target.value) || 0)}
                    size="small"
                    sx={{ width: 80 }}
                  />
                  <TextField
                    label="Max"
                    type="number"
                    value={range.max}
                    onChange={(e) => updateColorRange(index, 'max', parseInt(e.target.value) || 100)}
                    size="small"
                    sx={{ width: 80 }}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <input
                      type="color"
                      value={range.color}
                      onChange={(e) => updateColorRange(index, 'color', e.target.value)}
                      style={{
                        width: 40,
                        height: 35,
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer'
                      }}
                    />
                    <Chip
                      label={range.label || 'Range'}
                      size="small"
                      sx={{
                        backgroundColor: range.color,
                        color: 'white',
                        minWidth: 60
                      }}
                    />
                  </Box>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => removeColorRange(index)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              </Card>
            ))}
          </Box>
        )}
      </Paper>

      {/* Preview */}
      {localSettings.colorRanges.length > 0 && (
        <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Preview
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This is how your color ranges will appear in analytics:
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {localSettings.colorRanges.map((range, index) => (
              <Chip
                key={index}
                label={`${range.label} (${range.min}-${range.max})`}
                sx={{
                  backgroundColor: range.color,
                  color: 'white',
                  fontWeight: 'bold'
                }}
              />
            ))}
          </Stack>
        </Paper>
      )}
    </Box>
  );
};

export default AnalyticsSettings;
