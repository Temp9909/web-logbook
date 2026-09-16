import AppleToolbarButton from '../AppleToolbarButton';
import { useGridApiContext } from "@mui/x-data-grid";
import { useCallback } from "react";
import Tooltip from "@mui/material/Tooltip";
import SettingsBackupRestoreOutlinedIcon from '@mui/icons-material/SettingsBackupRestoreOutlined';

export const XToolbarResetColumns = ({ initialColumns = [] }) => {
  const apiRef = useGridApiContext();

  const resetColumns = useCallback(() => {
    if (apiRef?.current) {
      initialColumns.forEach((column) => {
        apiRef.current.setColumnWidth(column.field, column.width);
      });
    }
  }, [apiRef, initialColumns]);

  return (
    <Tooltip title="Reset Column Sizing">
      <AppleToolbarButton onClick={resetColumns} color="default">
        <SettingsBackupRestoreOutlinedIcon />
      </AppleToolbarButton>
    </Tooltip>
  );
}

export default XToolbarResetColumns;
