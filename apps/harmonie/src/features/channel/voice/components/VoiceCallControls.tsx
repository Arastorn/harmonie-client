import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChevronUp,
  Mic,
  MicOff,
  PhoneOff,
  ScreenShare,
  ScreenShareOff,
  Video,
  VideoOff,
} from 'lucide-react';
import { Button, IconButton, SplitIconButton } from '@harmonie/ui';
import { VideoInputPopover } from '@/features/user/video/VideoInputPopover';

interface VoiceCallControlsProps {
  isMuted: boolean;
  isCameraEnabled: boolean;
  isScreenSharing: boolean;
  screenShareError: string | null;
  cameraError: string | null;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onLeave: () => void;
}

export const VoiceCallControls = ({
  isMuted,
  isCameraEnabled,
  isScreenSharing,
  screenShareError,
  cameraError,
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
  onLeave,
}: VoiceCallControlsProps) => {
  const { t } = useTranslation();
  const controlError = cameraError ?? screenShareError;
  const [videoInputPopoverOpen, setVideoInputPopoverOpen] = useState(false);
  const videoInputChevronRef = useRef<HTMLButtonElement>(null);

  const handleToggleCamera = () => {
    setVideoInputPopoverOpen(false);
    onToggleCamera();
  };

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center px-4 pb-6 pt-16">
      <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-border-2 bg-surface-1 px-3 py-3 shadow-[0_4px_16px_rgba(61,53,48,0.10)]">
        <IconButton
          size="medium"
          variant={isMuted ? 'danger' : 'filled'}
          onClick={onToggleMute}
          aria-label={isMuted ? t('voice.unmute') : t('voice.mute')}
          title={isMuted ? t('voice.unmute') : t('voice.mute')}
        >
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </IconButton>

        <SplitIconButton
          ref={videoInputChevronRef}
          size="medium"
          selected={isCameraEnabled}
          selectedVariant="primary"
          open={videoInputPopoverOpen}
          primaryLabel={isCameraEnabled ? t('voice.stopCamera') : t('voice.startCamera')}
          secondaryLabel={t('video.input.select')}
          primaryIcon={isCameraEnabled ? <Video size={20} /> : <VideoOff size={20} />}
          secondaryIcon={
            <ChevronUp
              size={12}
              className={
                videoInputPopoverOpen
                  ? 'transition-transform duration-150'
                  : 'rotate-180 transition-transform duration-150'
              }
            />
          }
          onPrimaryClick={handleToggleCamera}
          onSecondaryClick={() => setVideoInputPopoverOpen((open) => !open)}
        />

        <IconButton
          size="medium"
          variant={isScreenSharing ? 'primary' : 'filled'}
          onClick={onToggleScreenShare}
          aria-label={isScreenSharing ? t('voice.stopScreenShare') : t('voice.startScreenShare')}
          title={isScreenSharing ? t('voice.stopScreenShare') : t('voice.startScreenShare')}
        >
          {isScreenSharing ? <ScreenShareOff size={20} /> : <ScreenShare size={20} />}
        </IconButton>

        <div className="hidden h-10 w-px bg-border-2 sm:block" />

        <Button
          variant="danger"
          onClick={onLeave}
          aria-label={t('voice.leave')}
          className="rounded-full px-5"
        >
          <PhoneOff size={18} />
          <span>{t('voice.leave')}</span>
        </Button>
      </div>
      {controlError && (
        <p className="pointer-events-auto absolute bottom-1 text-xs font-medium text-error">
          {t(controlError)}
        </p>
      )}
      {videoInputPopoverOpen && (
        <VideoInputPopover
          anchorRef={videoInputChevronRef}
          onClose={() => setVideoInputPopoverOpen(false)}
        />
      )}
    </div>
  );
};
