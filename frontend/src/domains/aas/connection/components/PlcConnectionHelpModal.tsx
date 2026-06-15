import { Modal } from '@/components/ui/Modal';

interface PlcConnectionHelpModalProps {
  open: boolean;
  onClose: () => void;
}

export default function PlcConnectionHelpModal({ open, onClose }: PlcConnectionHelpModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="PLC 연결 설정 도움말" width={960}>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(85vh - 110px)' }}>
        <iframe
          src="/help/plc-guide.html"
          title="PLC 연결 설정 도움말"
          style={{ flex: 1, border: 'none', borderRadius: 4 }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
        <button className="mes-btn" onClick={onClose}>닫기</button>
      </div>
    </Modal>
  );
}
