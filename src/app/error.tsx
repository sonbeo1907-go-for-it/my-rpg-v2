"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="page narrow-page">
      <h1>Trang hành trình bị gián đoạn.</h1>
      <p>Tiến trình đã lưu vẫn được giữ. Có thể thử mở lại trang.</p>
      <button className="gold" onClick={reset}>
        Thử lại
      </button>
    </main>
  );
}
