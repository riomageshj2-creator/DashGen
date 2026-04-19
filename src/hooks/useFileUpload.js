import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { parseFile } from '../utils/parseExcel';
import { detectColumnTypes, findPrimaryColumns } from '../utils/columnDetector';
import { generateParsedSummary } from '../utils/calculations';

const SESSION_KEY = 'dashgen_parsed_result';

/**
 * Save parsed result to sessionStorage so it survives page refresh.
 * We store a serializable subset (raw data can be large but still fits).
 */
function saveToSession(result) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(result));
  } catch (e) {
    console.warn('Could not save to sessionStorage:', e.message);
  }
}

function loadFromSession() {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.warn('Could not load from sessionStorage:', e.message);
  }
  return null;
}

function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch (e) {
    // ignore
  }
}

export function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState(null);
  const [parsedResult, setParsedResult] = useState(() => loadFromSession());

  const uploadAndParse = useCallback(async (file, userId) => {
    setUploading(true);
    setError(null);
    setParsedResult(null);

    try {
      // Step 1: Parse file
      setProgress('Reading file...');
      const { data, columns, sheetNames, sheetCount, rowCount } = await parseFile(file);

      // Step 2: Detect column types
      setProgress('Detecting columns...');
      const columnTypes = detectColumnTypes(data, columns);
      const primaryColumns = findPrimaryColumns(columnTypes);

      // Step 3: Compute stats
      setProgress('Computing analytics...');
      const summary = generateParsedSummary(data, columns, columnTypes, primaryColumns);

      // Removed automatic cloud save to allow manual saving


      const result = {
        data,
        columns,
        columnTypes,
        primaryColumns,
        summary,
        fileName: file.name,
        fileSize: file.size,
        fileId: null,
        rowCount,
        sheetCount,
      };

      setParsedResult(result);
      saveToSession(result);
      setProgress('Done!');
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  const processManualData = useCallback((dataRows, customFileName = 'Manual_Data') => {
    setUploading(true);
    setError(null);
    setParsedResult(null);

    try {
      setProgress('Processing data...');
      const columns = Object.keys(dataRows[0] || {});
      
      setProgress('Detecting columns...');
      const columnTypes = detectColumnTypes(dataRows, columns);
      const primaryColumns = findPrimaryColumns(columnTypes);

      setProgress('Computing analytics...');
      const summary = generateParsedSummary(dataRows, columns, columnTypes, primaryColumns);

      const result = {
        data: dataRows,
        columns,
        columnTypes,
        primaryColumns,
        summary,
        fileName: customFileName,
        fileSize: 0,
        fileId: null,
        rowCount: dataRows.length,
        sheetCount: 1,
      };

      setParsedResult(result);
      saveToSession(result);
      setProgress('Done!');
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setUploading(false);
      setProgress('');
    }
  }, []);

  const loadFromHistory = useCallback(async (fileRecord) => {
    setUploading(true);
    setError(null);

    try {
      setProgress('Loading saved dashboard...');
      const summary = fileRecord.parsed_summary;
      const rawData = summary?.rawData || null;
      const columnTypes = fileRecord.column_types || summary?.columnTypes || {};
      const primaryColumns = summary?.primaryColumns || findPrimaryColumns(columnTypes);

      const result = {
        data: rawData, // Restore raw data if available
        columns: fileRecord.column_names || [],
        columnTypes,
        primaryColumns,
        summary,
        fileName: fileRecord.file_name,
        fileId: fileRecord.id,
        rowCount: fileRecord.row_count,
        sheetCount: fileRecord.sheet_count,
        isHistorical: !rawData, // NOT historical if we have raw data!
      };

      setParsedResult(result);
      saveToSession(result);
      setProgress('Done!');
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setParsedResult(null);
    setError(null);
    setProgress('');
    clearSession();
  }, []);

  const saveDashboardToCloud = useCallback(async (userId, resultToSave = parsedResult) => {
    if (!resultToSave || !userId) return null;
    if (resultToSave.fileId) return { id: resultToSave.fileId }; // Already saved
    
    try {
      setUploading(true);
      setProgress('Saving to cloud...');

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timed out. Could not save dashboard. Please check your network or verify if your Supabase project is active.')), 10000);
      });

      const savePromise = supabase
        .from('uploaded_files')
        .insert({
          user_id: userId,
          file_name: resultToSave.fileName,
          file_size: resultToSave.fileSize || 0,
          sheet_count: resultToSave.sheetCount || 1,
          column_names: resultToSave.columns,
          column_types: resultToSave.columnTypes,
          row_count: resultToSave.rowCount,
          parsed_summary: {
            ...resultToSave.summary,
            rawData: resultToSave.data
          },
        })
        .select()
        .single();
        
      const result = await Promise.race([savePromise, timeoutPromise]);
      const { data: fileRecord, error: dbError } = result;

      if (dbError) throw dbError;

      const updatedResult = { ...resultToSave, fileId: fileRecord.id };
      setParsedResult(updatedResult);
      saveToSession(updatedResult);
      return fileRecord;
    } catch (err) {
      console.error('Supabase save error:', err);
      if (err.message && err.message.includes('JWT expired')) {
        await supabase.auth.signOut();
      }
      throw err;
    } finally {
      setUploading(false);
      setProgress('');
    }
  }, [parsedResult]);

  const toggleDashboardPublic = useCallback(async (fileId, isPublic) => {
    if (!fileId) return false;
    try {
      const { error: dbError } = await supabase
        .from('uploaded_files')
        .update({ is_public: isPublic })
        .eq('id', fileId);
      if (dbError) throw dbError;
      return true;
    } catch (err) {
      console.error('Error toggling public status:', err);
      if (err.message && err.message.includes('JWT expired')) {
        await supabase.auth.signOut();
      }
      return false;
    }
  }, []);

  const deleteDashboard = useCallback(async (fileId) => {
    if (!fileId) return false;
    try {
      const { error: dbError } = await supabase
        .from('uploaded_files')
        .delete()
        .eq('id', fileId);
      if (dbError) throw dbError;

      // Unset fileId from current state if the deleted file is currently loaded
      if (parsedResult && parsedResult.fileId === fileId) {
        const updatedResult = { ...parsedResult };
        delete updatedResult.fileId;
        setParsedResult(updatedResult);
        saveToSession(updatedResult);
      }
      return true;
    } catch (err) {
      console.error('Error deleting dashboard:', err);
      if (err.message && err.message.includes('JWT expired')) {
        await supabase.auth.signOut();
      }
      throw err;
    }
  }, [parsedResult]);

  return {
    uploading,
    progress,
    error,
    parsedResult,
    uploadAndParse,
    processManualData,
    loadFromHistory,
    saveDashboardToCloud,
    toggleDashboardPublic,
    deleteDashboard,
    reset,
  };
}
