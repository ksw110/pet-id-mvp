'use client';

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from 'react';

// 이 컴포넌트는 "파일 선택 + 미리보기 + 직접 크롭"을 한 번에 담당합니다.
// 사용자는 모바일 카드에서 보일 영역을 미리 맞춘 뒤 저장할 수 있습니다.
const CROP_VIEWPORT_WIDTH = 320;
const CROP_VIEWPORT_HEIGHT = 240;
const OUTPUT_IMAGE_WIDTH = 1200;
const OUTPUT_IMAGE_HEIGHT = Math.round(
  OUTPUT_IMAGE_WIDTH * (CROP_VIEWPORT_HEIGHT / CROP_VIEWPORT_WIDTH)
);
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
  // x, y는 "현재 사진이 크롭 프레임 안에서 얼마나 이동했는지"를 뜻합니다.
  // 둘 다 0이면 사진의 왼쪽 위가 프레임의 왼쪽 위에 붙어 있는 상태에 가깝습니다.
  x: number;
  y: number;
};

type LoadedImage = {
  // src는 브라우저가 임시로 만든 Object URL입니다.
  // width/height는 원본 사진 자체의 실제 픽셀 크기입니다.
  src: string;
  width: number;
  height: number;
};

// 사람이 읽기 쉬운 MB 문자열로 바꿔 에러 메시지에 사용합니다.
function formatFileSize(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

// 확장자를 제외한 파일 이름을 뽑아서, 최종 저장 파일명에 재사용합니다.
function getFileBaseName(name: string) {
  return name.replace(/\.[^.]+$/, '') || 'pet-photo';
}

// 크롭 프레임을 빈 공간 없이 꽉 채우려면 이미지가 최소 얼마까지 확대돼야 하는지 계산합니다.
function getMinimumScale(image: LoadedImage) {
  return Math.max(CROP_VIEWPORT_WIDTH / image.width, CROP_VIEWPORT_HEIGHT / image.height);
}

// 사용자가 이미지를 너무 멀리 드래그해서 빈 배경이 보이지 않도록 좌표를 제한합니다.
function clampPosition(position: CropPosition, width: number, height: number) {
  const minX = Math.min(0, CROP_VIEWPORT_WIDTH - width);
  const minY = Math.min(0, CROP_VIEWPORT_HEIGHT - height);

  return {
    x: Math.min(0, Math.max(minX, position.x)),
    y: Math.min(0, Math.max(minY, position.y)),
  };
}

// 처음 크롭 다이얼로그를 열었을 때 사진이 가운데에 보이도록 시작 위치를 계산합니다.
function centerPosition(width: number, height: number) {
  return clampPosition(
    {
      x: (CROP_VIEWPORT_WIDTH - width) / 2,
      y: (CROP_VIEWPORT_HEIGHT - height) / 2,
    },
    width,
    height
  );
}

// File 객체를 브라우저 이미지로 읽어 크기 정보를 준비합니다.
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

// 사용자가 고른 위치/줌 값을 바탕으로 실제 업로드용 이미지를 새로 만듭니다.
// 핵심은 "원본 이미지의 어떤 영역을 잘라낼지"를 계산한 뒤 canvas에 다시 그리는 것입니다.
async function createCroppedImageFile(
  sourceFile: File,
  image: LoadedImage,
  zoom: number,
  position: CropPosition
) {
  const minScale = getMinimumScale(image);
  const scale = minScale * zoom;
  const cropSourceWidth = CROP_VIEWPORT_WIDTH / scale;
  const cropSourceHeight = CROP_VIEWPORT_HEIGHT / scale;
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

  // 크롭 프레임과 같은 4:3 비율로 저장해야, 미리보기와 결과 이미지가 다르게 보이지 않습니다.
  canvas.width = OUTPUT_IMAGE_WIDTH;
  canvas.height = OUTPUT_IMAGE_HEIGHT;
  context.drawImage(
    sourceImage,
    sourceX,
    sourceY,
    cropSourceWidth,
    cropSourceHeight,
    0,
    0,
    OUTPUT_IMAGE_WIDTH,
    OUTPUT_IMAGE_HEIGHT
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
  // 다이얼로그 내부에서는 "현재 불러온 이미지", "줌 값", "사진 위치"를
  // 별도의 state로 관리해야 실시간 드래그/확대 UI가 가능합니다.
  const [loadedImage, setLoadedImage] = useState<LoadedImage | null>(null);

  // zoom:
  // 1이면 최소 확대 상태, 3에 가까울수록 더 많이 확대된 상태입니다.
  const [zoom, setZoom] = useState(1);

  // position:
  // 사용자가 드래그해서 사진을 어디로 옮겼는지 저장합니다.
  const [position, setPosition] = useState<CropPosition>({ x: 0, y: 0 });

  // saving:
  // "사용하기"를 눌러 실제 이미지 파일을 만드는 중인지 여부입니다.
  const [saving, setSaving] = useState(false);

  // dragStateRef:
  // 드래그 시작 시점의 마우스/터치 좌표를 기억해두는 임시 저장소입니다.
  // ref를 쓰는 이유는 드래그 중 자주 바뀌는 값을 렌더링과 분리하고 싶기 때문입니다.
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

    // 파일이 바뀔 때마다 새 이미지를 읽고, 이전 Object URL은 정리합니다.
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
  const displayWidth = loadedImage ? loadedImage.width * scale : CROP_VIEWPORT_WIDTH;
  const displayHeight = loadedImage ? loadedImage.height * scale : CROP_VIEWPORT_HEIGHT;

  function updateZoom(nextZoom: number) {
    if (!loadedImage) {
      return;
    }

    const safeZoom = Math.min(3, Math.max(1, nextZoom));
    const currentScale = minScale * zoom;
    const nextScale = minScale * safeZoom;
    // 줌을 바꿔도 사용자가 보고 있던 중심점이 크게 튀지 않게,
    // 현재 중앙이 원본 이미지의 어느 지점을 가리키는지 기준으로 다시 계산합니다.
    const centerSourceX = (CROP_VIEWPORT_WIDTH / 2 - position.x) / currentScale;
    const centerSourceY = (CROP_VIEWPORT_HEIGHT / 2 - position.y) / currentScale;
    const nextWidth = loadedImage.width * nextScale;
    const nextHeight = loadedImage.height * nextScale;

    setZoom(safeZoom);
    setPosition(
      clampPosition(
        {
          x: CROP_VIEWPORT_WIDTH / 2 - centerSourceX * nextScale,
          y: CROP_VIEWPORT_HEIGHT / 2 - centerSourceY * nextScale,
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

    // drag 시작 시점의 포인터 위치와 이미지 원래 위치를 기억해두면,
    // move 이벤트에서 차이값(delta)만 계산해 자연스럽게 이동시킬 수 있습니다.
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

    // "사용하기"를 누르면 실제로 잘린 이미지를 만들고 부모 컴포넌트에 전달합니다.
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
                모바일 카드에서 보일 영역에 맞게 사진을 드래그하고 확대해주세요.
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
              className="relative overflow-hidden rounded-[28px] bg-[#e5ded2] touch-none"
              style={{ width: CROP_VIEWPORT_WIDTH, height: CROP_VIEWPORT_HEIGHT }}
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
              <div className="pointer-events-none absolute inset-0 rounded-[28px] border-[3px] border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.28)]" />
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

          <div className="mt-6 flex flex-row gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="min-h-16 flex-1 rounded-2xl border border-[#ddd6c9] bg-white px-5 py-4 text-[17px] font-bold text-[#5f574c] disabled:opacity-60"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleComplete}
              disabled={!loadedImage || saving}
              className="min-h-16 flex-1 rounded-2xl bg-[#ffd766] px-5 py-4 text-[17px] font-black text-[#211a0c] shadow-[0_10px_24px_rgba(229,173,36,0.28)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? '사진 준비 중...' : '사용하기'}
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
  // 부모는 "최종 선택된 파일"만 필요하고,
  // 이 컴포넌트는 그 전에 열리는 크롭용 임시 상태도 함께 관리합니다.

  // cropSourceFile:
  // 사용자가 방금 파일 선택창에서 고른 "원본 파일"입니다.
  // 아직 최종 저장된 파일이 아니라, 크롭 다이얼로그에 보여주기 위한 값입니다.
  const [cropSourceFile, setCropSourceFile] = useState<File | null>(null);

  // cropOpen:
  // 크롭 다이얼로그를 열지 닫을지 제어합니다.
  const [cropOpen, setCropOpen] = useState(false);

  // processing:
  // 최종 파일을 준비해서 부모에게 넘기는 중인지 여부입니다.
  const [processing, setProcessing] = useState(false);

  // previewUrl:
  // 사용자가 선택한 최종 이미지를 브라우저에서 즉시 보여주기 위한 임시 URL입니다.
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
      // 최종 저장 전 용량 제한을 한 번 더 검사해 업로드 실패를 미리 막습니다.
      if (file.size > maxUploadBytes) {
        throw new Error(
          `사진 용량이 너무 커요. 현재 ${formatFileSize(file.size)}라서 4MB 이하 사진으로 다시 선택해주세요.`
        );
      }

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      // 미리보기는 서버 업로드 전에 브라우저에서 바로 보여주기 위해 Object URL을 사용합니다.
      setPreviewUrl(URL.createObjectURL(file));
      onChange(file);
    } finally {
      setProcessing(false);
    }
  }

  const displayPreviewUrl = previewUrl || existingImageUrl || '';

  // displayPreviewUrl:
  // 우선순위는 "방금 새로 고른 미리보기" -> "기존 저장된 사진 URL" 순서입니다.
  // 수정 페이지에서 이 로직이 특히 중요합니다.

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
            <div className="w-full max-w-[320px] overflow-hidden rounded-[24px] border-4 border-white shadow-[0_12px_32px_rgba(55,45,30,0.12)] aspect-[4/3]">
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
