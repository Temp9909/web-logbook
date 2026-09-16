import { useState } from 'react';
// MUI Icons
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
// Custom components and libraries
import OpenCSVButton from './OpenCSVButton';
import ClearTableButton from './ClearTableButton';
import RunImportButton from './RunImportButton';
import HelpButton from './HelpButton';
import LogbookTable from '../Logbook/LogbookTable';

export const ImportTable = ({ embedded = false }) => {
  const [data, setData] = useState([]);

  const customActions = (
    <>
      <HelpButton />
      <ClearTableButton setData={setData} />
      <OpenCSVButton setData={setData} />
      <RunImportButton data={data} />
    </>
  );

  return (
    <>
      <LogbookTable
        data={data}
        customActions={customActions}
        title={embedded ? "" : "Import"}
        icon={embedded ? null : <FileUploadOutlinedIcon />}
        disableColumnSorting
        disableColumnMenu
      />
    </>
  );
}

export default ImportTable;