import { memo, useCallback, useMemo, useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Badge from '@mui/material/Badge';
import Divider from '@mui/material/Divider';
import { useMediaQuery, useTheme } from '@mui/material';
import MoreVertOutlinedIcon from '@mui/icons-material/MoreVertOutlined';
import XToolbarQuickFilter from './XToolbarQuickFilter';
import XToolbarResetColumns from './XToolbarResetColumns';
import XToolbarColumnsPanelTrigger from './XToolbarColumnsPanel';
import XToolbarFilterPanelTrigger from './XToolbarFilterPanel';
import { useFilter } from './FilterContext';

const EMPTY_COLUMNS = [];

const ToolbarTitle = ({ icon, title }) => {
  if (!title && !icon) return null;
  return (
    <div className="apple-grid-toolbar-title">
      {icon ? <span className="apple-grid-toolbar-icon">{icon}</span> : null}
      {title ? <span>{title}</span> : null}
    </div>
  );
};

export const XToolbar = ({
  title,
  icon,
  customActions,
  showQuickFilter = true,
  showColumnsPanel = true,
  showResetColumns = true,
  showFilters = true,
  initialColumns = EMPTY_COLUMNS,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);
  const mobileMenuOpen = Boolean(mobileMenuAnchor);
  const { filterModel } = useFilter();

  const handleMobileMenuOpen = useCallback((event) => setMobileMenuAnchor(event.currentTarget), []);
  const handleMobileMenuClose = useCallback(() => setMobileMenuAnchor(null), []);

  const mobileMenuItems = useMemo(() => {
    const items = [];
    if (customActions) {
      const actions = Array.isArray(customActions.props?.children)
        ? customActions.props.children
        : [customActions.props?.children || customActions];
      actions.filter(Boolean).forEach((action, index) => {
        items.push(
          <MenuItem key={`custom-${index}`} onClick={handleMobileMenuClose} sx={{ p: 0 }}>
            {action}
          </MenuItem>
        );
      });
      if (showFilters || showColumnsPanel || showResetColumns) items.push(<Divider key="divider-custom" />);
    }
    if (showFilters) items.push(<MenuItem key="filter" onClick={handleMobileMenuClose} sx={{ p: 0 }}><XToolbarFilterPanelTrigger /></MenuItem>);
    if (showColumnsPanel) items.push(<MenuItem key="columns" onClick={handleMobileMenuClose} sx={{ p: 0 }}><XToolbarColumnsPanelTrigger /></MenuItem>);
    if (showResetColumns) items.push(<MenuItem key="reset" onClick={handleMobileMenuClose} sx={{ p: 0 }}><XToolbarResetColumns initialColumns={initialColumns} /></MenuItem>);
    return items;
  }, [customActions, handleMobileMenuClose, initialColumns, showColumnsPanel, showFilters, showResetColumns]);

  if (isMobile) {
    return (
      <div className="apple-grid-toolbar apple-grid-toolbar-mobile">
        <ToolbarTitle icon={icon} title={title} />
        <div className="apple-grid-toolbar-actions">
          {showQuickFilter ? <XToolbarQuickFilter /> : null}
          <IconButton className="apple-grid-more" onClick={handleMobileMenuOpen}>
            <Badge badgeContent={filterModel.items.length} color="primary"><MoreVertOutlinedIcon /></Badge>
          </IconButton>
        </div>
        <Menu
          id="toolbar-mobile-menu"
          anchorEl={mobileMenuAnchor}
          open={mobileMenuOpen}
          onClose={handleMobileMenuClose}
          keepMounted
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          {mobileMenuItems}
        </Menu>
      </div>
    );
  }

  return (
    <div className="apple-grid-toolbar">
      <ToolbarTitle icon={icon} title={title} />
      <div className="apple-grid-toolbar-actions">
        {customActions}
        {showQuickFilter ? <XToolbarQuickFilter /> : null}
        {showFilters ? <XToolbarFilterPanelTrigger /> : null}
        {showColumnsPanel ? <XToolbarColumnsPanelTrigger /> : null}
        {showResetColumns ? <XToolbarResetColumns initialColumns={initialColumns} /> : null}
      </div>
    </div>
  );
}

export default memo(XToolbar);
