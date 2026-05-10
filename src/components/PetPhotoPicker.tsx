'use client';

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from 'react';

const CROP_VIEWPORT_SIZE = 320;
const MAX_IMAGE_SIZE = 1200;
const IMAGE_QUALITY = 0.82;
const DEFAULT_MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

type PetPhotoPickerProps = {
  label: string;
  required?: boolean;
  hintText?: string;
  emptyText: string;
  helperText: string;
  value: File | null;
  existingImageUrl?: string;
  onChange: (file: File | null) => void;
  onProcessingChange?: (processing: boolean) => void;
  maxUploadBytes?: number;
};

type CropPosition = {
  x: number;
  y: number;
};

type LoadedImage = {
  src: string;
  width: number;
  height: number;
};

function formatFileSize(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

function getFileBaseName(name: string) {
  return name.replace(/\.[^.]+$/, '') || 'pet-photo';
}

function getMinimumScale(image: LoadedImage) {
  return Math.max(CROP_VIEWPORT_SIZE / image.width, CROP_VIEWPORT_SIZE / image.height);
}

function clampPosition(position: CropPosition, width: number, height: number) {
  const minX = Math.min(0, CROP_VIEWPORT_SIZE - width);
  const minY = Math.min(0, CROP_VIEWPORT_SIZE - height);

  return {
    x: Math.min(0, Math.max(minX, position.x)),
    y: Math.min(0, Math.max(minY, position.y)),
  };
}

function centerPosition(width: number, height: number) {
  return clampPosition(
    {
      x: (CROP_VIEWPORT_SIZE - width) / 2,
      y: (CROP_VIEWPORT_SIZE - height) / 2,
    },
    width,
    height
  );
}

async function loadImage(file: File) {
  const src = URL.createObjectURL(file);
  const image = document.createElement('img');

  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('이미지를 불러오지 못했습니다.'));
      image.src = src;
    });

    return {
      src,
      width: image.naturalWidth,
      height: image.naturalHeight,
    };
  } catch (error) {
    URL.revokeObjectURL(src);
    throw error;
  }
}

async function createCroppedImageFile(
  sourceFile: File,
  image: LoadedImage,
  zoom: number,
  position: CropPosition
) {
  const minScale = getMinimumScale(image);
  const scale = minScale * zoom;
  const cropSourceSize = CROP_VIEWPORT_SIZE / scale;
  const sourceX = Math.max(0, -position.x / scale);
  const sourceY = Math.max(0, -position.y / scale);
  const sourceImage = document.createElement('img');

  await new Promise<void>((resolve, reject) => {
    sourceImage.onload = () => resolve();
    sourceImage.onerror = () => reject(new Error('사진을 처리하지 못했습니다.'));
    sourceImage.src = image.src;
  });

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('사진 편집을 준비하지 못했습니다.');
  }

  canvas.width = MAX_IMAGE_SIZE;
  canvas.height = MAX_IMAGE_SIZE;
  context.drawImage(
    sourceImage,
    sourceX,
    sourceY,
    cropSourceSize,
    cropSourceSize,
    0,
    0,
    MAX_IMAGE_SIZE,
    MAX_IMAGE_SIZE
  );

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', IMAGE_QUALITY);
  });

  if (!blob) {
    throw new Error('사진 저장에 실패했어요.');
  }

  return new File([blob], `${getFileBaseName(sourceFile.name)}.jpg`, {
    type: 'image/jpeg',
    lastModified: Date.now(),
  });
}

function ImageCropDialog({
  file,
  open,
  onClose,
  onComplete,
}: {
  file: File | null;
  open: boolean;
  onClose: () => void;
  onComplete: (file: File) => Promise<void> | void;
}) {
  const [loadedImage, setLoadedImage] = useState<LoadedImage | null>(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState<CropPosition>({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origin: CropPosition;
  } | null>(null);

  useEffect(() => {
    if (!open || !file) {
      return;
    }

    let active = true;
    let loadedSrc = '';

    loadImage(file)
      .then((image) => {
        if (!active) {
          URL.revokeObjectURL(image.src);
          return;
        }

        loadedSrc = image.src;
        const minScale = getMinimumScale(image);
        const width = image.width * minScale;
        const height = image.height * minScale;

        setLoadedImage(image);
        setZoom(1);
        setPosition(centerPosition(width, height));
      })
      .catch((error) => {
        const message =
          error instanceof Error ? error.message : '이미지를 불러오지 못했습니다.';
        alert(message);
        onClose();
      });

    return () => {
      active = false;
      if (loadedSrc) {
        URL.revokeObjectURL(loadedSrc);
      }
    };
  }, [file, onClose, open]);

  if (!open || !file) {
    return null;
  }

  const minScale = loadedImage ? getMinimumScale(loadedImage) : 1;
  const scale = minScale * zoom;
  const displayWidth = loadedImage ? loadedImage.width * scale : CROP_VIEWPORT_SIZE;
  const displayHeight = loadedImage ? loadedImage.height * scale : CROP_VIEWPORT_SIZE;

  function updateZoom(nextZoom: number) {
    if (!loadedImage) {
      return;
    }

    const safeZoom = Math.min(3, Math.max(1, nextZoom));
    const currentScale = minScale * zoom;
    const nextScale = minScale * safeZoom;
    const centerSourceX = (CROP_VIEWPORT_SIZE / 2 - position.x) / currentScale;
    const centerSourceY = (CROP_VIEWPORT_SIZE / 2 - position.y) / currentScale;
    const nextWidth = loadedImage.width * nextScale;
    const nextHeight = loadedImage.height * nextScale;

    setZoom(safeZoom);
    setPosition(
      clampPosition(
        {
          x: CROP_VIEWPORT_SIZE / 2 - centerSourceX * nextScale,
          y: CROP_VIEWPORT_SIZE / 2 - centerSourceY * nextScale,
        },
        nextWidth,
        nextHeight
      )
    );
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!loadedImage || saving) {
      return;
    }

    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: position,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!loadedImage || !dragStateRef.current || dragStateRef.current.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragStateRef.current.startX;
    const deltaY = event.clientY - dragStateRef.current.startY;

    setPosition(
      clampPosition(
        {
          x: dragStateRef.current.origin.x + deltaX,
          y: dragStateRef.current.origin.y + deltaY,
        },
        displayWidth,
        displayHeight
      )
    );
  }

  function handlePointerEnd(event: React.PointerEvent<HTMLDivElement>) {
    if (dragStateRef.current?.pointerId !== event.pointerId) {
      return;
    }

    dragStateRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  async function handleComplete() {
    if (!loadedImage || !file) {
      return;
    }

    setSaving(true);

    try {
      const croppedFile = await createCroppedImageFile(file, loadedImage, zoom, position);
      await onComplete(croppedFile);
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '사진 편집을 완료하지 못했습니다.';
      alert(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pet-photo-crop-title"
      className="fixed inset-0 z-50 flex items-end bg-black/55 px-3 py-4 sm:items-center sm:px-6"
    >
      <div className="mx-auto flex w-full max-w-xl flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
        <header className="border-b border-[#f0ece4] px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 id="pet-photo-crop-title" className="text-lg font-black text-[#171717]">
                사진 영역 선택
              </h2>
              <p className="mt-1 text-sm text-[#6f6657]">
                사진을 드래그하고 확대해서 보여주고 싶은 부분을 맞춰주세요.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="grid h-9 w-9 place-items-center rounded-full bg-[#f7f3ec] text-lg font-black text-[#171717] disabled:opacity-60"
              aria-label="사진 영역 선택 닫기"
            >
              ×
            </button>
          </div>
        </header>

        <div className="px-5 pb-5 pt-4">
          <div className="grid place-items-center rounded-[24px] bg-[#f6f0e8] px-4 py-5">
            <div
              className="relative overflow-hidden rounded-full bg-[#e5ded2] touch-none"
              style={{ width: CROP_VIEWPORT_SIZE, height: CROP_VIEWPORT_SIZE }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerEnd}
              onPointerCancel={handlePointerEnd}
            >
              {loadedImage ? (
                <img
                  src={loadedImage.src}
                  alt="크롭할 원본 사진"
                  draggable={false}
                  className="absolute max-w-none select-none"
                  style={{
                    left: position.x,
                    top: position.y,
                    width: displayWidth,
                    height: displayHeight,
                  }}
                />
              ) : (
                <div className="grid h-full place-items-center text-sm font-bold text-[#6f6657]">
                  이미지 준비 중...
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 rounded-full border-[3px] border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.28)]" />
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between text-sm font-bold text-[#5f574c]">
              <span>확대</span>
              <span>{Math.round(zoom * 100)}%</span>
            </div>
            <input
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={zoom}
              disabled={!loadedImage || saving}
              onChange={(event) => updateZoom(Number(event.target.value))}
              className="mt-3 h-2 w-full cursor-pointer accent-[#f2bd33]"
            />
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-12 flex-1 rounded-xl border border-[#ddd6c9] bg-white px-4 text-sm font-bold text-[#5f574c] disabled:opacity-60"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleComplete}
              disabled={!loadedImage || saving}
              className="h-12 flex-1 rounded-xl bg-[#ffd766] px-4 text-sm font-black text-[#211a0c] shadow-[0_10px_24px_rgba(229,173,36,0.28)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? '사진 준비 중...' : '이 영역으로 사용하기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PetPhotoPicker({
  label,
  required = false,
  hintText,
  emptyText,
  helperText,
  value,
  existingImageUrl,
  onChange,
  onProcessingChange,
  maxUploadBytes = DEFAULT_MAX_UPLOAD_BYTES,
}: PetPhotoPickerProps) {
  const [cropSourceFile, setCropSourceFile] = useState<File | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    onProcessingChange?.(processing);
  }, [onProcessingChange, processing]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function handleCropComplete(file: File) {
    setProcessing(true);

    try {
      if (file.size > maxUploadBytes) {
        throw new Error(
          `사진 용량이 너무 커요. 현재 ${formatFileSize(file.size)}라서 4MB 이하 사진으로 다시 선택해주세요.`
        );
      }

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      setPreviewUrl(URL.createObjectURL(file));
      onChange(file);
    } finally {
      setProcessing(false);
    }
  }

  const displayPreviewUrl = previewUrl || existingImageUrl || '';

  return (
    <>
      <label className="block">
        <span className="mb-2 block text-sm font-bold">
          {label}{' '}
          {required ? (
            <span className="text-[#ee6958]">*</span>
          ) : (
            <span className="font-medium text-[#8b8378]">(선택)</span>
          )}
        </span>

        {displayPreviewUrl && (
          <div className="mb-3 flex justify-center rounded-2xl border border-[#ece7dd] bg-[#f6f0e8] px-4 py-4">
            <div className="h-52 w-52 overflow-hidden rounded-full border-4 border-white shadow-[0_12px_32px_rgba(55,45,30,0.12)]">
              <img
                src={displayPreviewUrl}
                alt="선택한 반려견 사진 미리보기"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        )}

        <span className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#d9d2c7] bg-[#fffdf8] px-4 py-5 text-center transition hover:border-[#f2bd33] hover:bg-[#fff8e5]">
          <span className="mb-2 grid h-10 w-10 place-items-center rounded-full bg-white text-xl shadow-sm">📷</span>
          <span className="text-sm font-bold">
            {processing ? '사진 준비 중...' : value?.name || emptyText}
          </span>
          <span className="mt-1 text-xs text-[#8b8378]">{helperText}</span>
        </span>

        <input
          type="file"
          accept="image/*"
          className="sr-only"
          required={required && !value}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';

            if (!file) {
              return;
            }

            setCropSourceFile(file);
            setCropOpen(true);
          }}
        />

        {hintText && <span className="mt-2 block text-xs leading-5 text-[#8b8378]">{hintText}</span>}
      </label>

      <ImageCropDialog
        key={cropSourceFile ? `${cropSourceFile.name}-${cropSourceFile.lastModified}` : 'empty'}
        file={cropSourceFile}
        open={cropOpen}
        onClose={() => {
          setCropOpen(false);
          setCropSourceFile(null);
        }}
        onComplete={handleCropComplete}
      />
    </>
  );
}
