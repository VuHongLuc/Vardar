import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import numeral from 'numeral'
import { useCallback, useEffect } from 'react'
// import { toast } from 'react-hot-toast'
import styled from 'styled-components'

import { LegacyFileExplorer } from '../../components/LegacyFileExplorer'
import { CacheKey } from '../../constants'
import { Core } from '../../core/types'
import { Button } from '../../elements/Button'
import { LegacyScanningSpinner } from '../../elements/LegacyScanningSpinner'
import { useCachedState } from '../../hooks/useCachedState'
import { ScreenBox } from '../../layouts/ScreenBox'

export function Scanner() {
  const [state, setState] = useCachedState<Core.ScannerState | undefined>(CacheKey.ScannerState, undefined)
  const [status, setStatus] = useCachedState<Core.ScannerStatus | undefined>(CacheKey.ScannerStatus, undefined)

  const handleFileExplorerCheck = useCallback(async (node: Core.LegacyFileExplorerNode) => {
    await invoke('toggle_file_explorer_node_check', {
      indexPath: node.index_path,
    })
  }, [])

  const handleFileExplorerExpansion = useCallback(async (node: Core.LegacyFileExplorerNode) => {
    await invoke('toggle_file_explorer_node_expansion', {
      indexPath: node.index_path,
    })
  }, [])

  const startScanner = useCallback(() => {
    invoke('start_scanner')
  }, [])

  const stopScanner = useCallback(() => {
    invoke('stop_scanner')
  }, [])

  useEffect(() => {
    invoke('load_scanner_state')

    listen<Core.ScannerState>('scanner:state', event => {
      setState(event.payload)
    })

    listen<Core.ScannerStatus>('scanner:status', event => {
      setStatus(event.payload)
    })
  }, [setState, setStatus])

  const currentFilePath = status?.current_file_path

  return (
    <ScreenBox>
      {!!state && !state.is_running && (
        <Box>
          <LegacyFileExplorer
            onCheck={handleFileExplorerCheck}
            onExpand={handleFileExplorerExpansion}
            tree={state.file_explorer_tree}
          />

          <Button onClick={startScanner} style={{ marginTop: 16 }}>
            Start Scan
          </Button>
        </Box>
      )}

      {!!state && state.is_running && status && (
        <Box>
          <InnerBox>
            <LegacyScanningSpinner />
            <Progress>{numeral(status.progress || 0).format('0.00%')}</Progress>

            <Status $isSmall={!!currentFilePath && currentFilePath.length > 0}>
              {!!currentFilePath && currentFilePath.length > 0 ? currentFilePath : `${status?.step}...`}
            </Status>
          </InnerBox>

          <Button
            disabled={[Core.ScannerStatusStep.Counting, Core.ScannerStatusStep.Stopping].includes(status.step)}
            onClick={stopScanner}
            style={{ marginTop: 16 }}
          >
            {status.step === Core.ScannerStatusStep.Stopping ? 'Stopping (gracefully)...' : 'Stop Scan'}
          </Button>
        </Box>
      )}
    </ScreenBox>
  )
}

const Box = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
`

const InnerBox = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  justify-content: center;
`

const Status = styled.p<{
  $isSmall: boolean
}>`
  color: white;
  font-size: ${({ $isSmall }) => ($isSmall ? '75%' : '100%')};
  overflow: hidden;
  padding-top: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 640px;
  text-align: center;
`

const Progress = styled.span`
  color: gold;
  font-size: 12px;
  font-weight: 700;
  position: absolute;
  margin-top: -40px;
`
