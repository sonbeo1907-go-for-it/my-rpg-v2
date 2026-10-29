import Link from "next/link";
export default function NotFound() {
  return (
    <main className="page narrow-page">
      <h1>Con đường này chưa được khai mở.</h1>
      <Link className="button gold" href="/home">
        Trở về quán trọ
      </Link>
    </main>
  );
}
