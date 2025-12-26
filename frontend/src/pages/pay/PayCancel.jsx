import { useSearchParams, useNavigate } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import Button from "../../components/ui/Button";

export default function PayCancel() {
  const nav = useNavigate();
  const [params] = useSearchParams();

  const token = params.get("token");

  return (
    <MainLayout>
      <div className="max-w-lg mx-auto p-6">
        <div className="h2h-card p-6 text-center space-y-4">
          <div className="text-5xl">❌</div>

          <h1 className="text-xl font-bold text-white">
            ยกเลิกการชำระเงิน
          </h1>

          <p className="text-sm text-white/70">
            คุณได้ยกเลิกการทำรายการชำระเงินเรียบร้อยแล้ว
          </p>

          {token && (
            <div className="text-xs text-white/50 break-all">
              Ref: {token}
            </div>
          )}

          <div className="pt-4 flex flex-col gap-2">
            <Button onClick={() => nav(-1)}>
              ← กลับไปหน้าก่อนหน้า
            </Button>

            <Button variant="ghost" onClick={() => nav("/")}>
              กลับหน้าแรก
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
