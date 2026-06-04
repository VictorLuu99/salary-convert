import { type CSSProperties, type ReactNode, useMemo, useState } from "react";
import {
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronDown,
  Download,
  Home,
  Info,
  LockKeyhole,
  Menu,
  Minus,
  Moon,
  Plus,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  WalletCards,
  Zap,
} from "lucide-react";
import {
  calculateGrossToNet,
  calculateNetToGross,
  DEPENDENT_DEDUCTION,
  EMPLOYEE_INSURANCE_RATES,
  formatVnd,
  parseVnd,
  PERSONAL_DEDUCTION,
  REGION_MINIMUM_WAGES,
  type Region,
  type SalaryResult,
} from "./salary";

type Mode = "grossToNet" | "netToGross";

const regionOptions: Array<{ value: Region; label: string }> = [
  { value: "I", label: "Vùng 1" },
  { value: "II", label: "Vùng 2" },
  { value: "III", label: "Vùng 3" },
  { value: "IV", label: "Vùng 4" },
];

function App() {
  const [mode, setMode] = useState<Mode>("grossToNet");
  const [salary, setSalary] = useState(35_000_000);
  const [region, setRegion] = useState<Region>("I");
  const [dependents, setDependents] = useState(2);
  const [insuranceSalary, setInsuranceSalary] = useState(35_000_000);
  const [insurancePercent, setInsurancePercent] = useState(100);
  const [autoInsurance, setAutoInsurance] = useState(true);
  const [applyBounds, setApplyBounds] = useState(true);
  const [showFormula, setShowFormula] = useState(false);

  const result = useMemo<SalaryResult>(() => {
    if (mode === "grossToNet") {
      return calculateGrossToNet({
        grossSalary: salary,
        dependents,
        region,
        insuranceSalary: autoInsurance ? salary : insuranceSalary,
        insuranceContributionPercent: insurancePercent,
        applyInsuranceBounds: applyBounds,
      });
    }

    return calculateNetToGross({
      targetNetSalary: salary,
      dependents,
      region,
      insuranceContributionPercent: insurancePercent,
      applyInsuranceBounds: applyBounds,
      insuranceBaseMode: autoInsurance ? "matchGross" : "fixed",
      fixedInsuranceSalary: insuranceSalary,
    });
  }, [
    applyBounds,
    autoInsurance,
    dependents,
    insurancePercent,
    insuranceSalary,
    mode,
    region,
    salary,
  ]);

  const primaryAmount =
    mode === "grossToNet" ? result.netSalary : result.grossSalary;
  const primaryLabel =
    mode === "grossToNet" ? "Lương thực lĩnh" : "Lương gross cần có";

  const shareResult = async () => {
    const text = `${primaryLabel}: ${formatVnd(primaryAmount)}\nGross: ${formatVnd(
      result.grossSalary,
    )}\nNet: ${formatVnd(result.netSalary)}\nBảo hiểm: ${formatVnd(
      result.totalInsurance,
    )}\nThuế TNCN: ${formatVnd(result.personalIncomeTax)}`;

    if (navigator.share) {
      await navigator.share({ title: "Kết quả tính lương Gross Net", text });
      return;
    }

    await navigator.clipboard.writeText(text);
  };

  const downloadResult = () => {
    const lines = [
      "Ket qua tinh luong Gross Net 2026",
      `Che do: ${mode === "grossToNet" ? "Gross sang Net" : "Net sang Gross"}`,
      `Gross: ${formatVnd(result.grossSalary)}`,
      `Net: ${formatVnd(result.netSalary)}`,
      `BHXH: ${formatVnd(result.socialInsurance)}`,
      `BHYT: ${formatVnd(result.healthInsurance)}`,
      `BHTN: ${formatVnd(result.unemploymentInsurance)}`,
      `Giam tru gia canh: ${formatVnd(result.familyDeduction)}`,
      `Thu nhap tinh thue: ${formatVnd(result.taxableIncome)}`,
      `Thue TNCN: ${formatVnd(result.personalIncomeTax)}`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ket-qua-tinh-luong.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="site-shell">
      <div className="aurora-lines" aria-hidden="true" />
      <div className="page-frame">
        <header className="topbar">
          <a className="brand" href="#top" aria-label="G Net">
            <span>G</span>
            <span className="swap">↔</span>
            <span>N</span>
          </a>
          <nav className="desktop-nav" aria-label="Điều hướng">
            <a href="#calculator">Tính lương</a>
            <a href="#guide">Hướng dẫn</a>
            <a href="#legal">Căn cứ pháp lý</a>
            <a href="#faq">Câu hỏi thường gặp</a>
          </nav>
          <div className="top-actions">
            <button className="icon-button" aria-label="Đổi giao diện">
              <Moon size={18} />
            </button>
            <button className="ghost-button" onClick={shareResult}>
              <Share2 size={16} />
              Chia sẻ
            </button>
            <button className="icon-button mobile-menu" aria-label="Menu">
              <Menu size={20} />
            </button>
          </div>
        </header>

        <section className="hero" id="top">
          <div className="hero-copy">
            <p className="tool-label">Công cụ tính lương 2026</p>
            <h1>
              Tính lương <span>Gross ↔ Net</span>
            </h1>
            <p className="hero-description">
              Chuyển đổi lương chính xác theo quy định mới nhất. Xem đầy đủ
              bảo hiểm, giảm trừ, thu nhập tính thuế và thực lĩnh.
            </p>

            <div className="trust-strip" aria-label="Điểm nổi bật">
              <TrustItem icon={<Zap size={22} />} title="Chính xác" text="Theo luật 2026" />
              <TrustItem
                icon={<ShieldCheck size={22} />}
                title="Minh bạch"
                text="Đầy đủ khoản đóng"
              />
              <TrustItem icon={<LockKeyhole size={22} />} title="Bảo mật" text="Không lưu dữ liệu" />
            </div>
          </div>

          <section className="calculator-stack" id="calculator" aria-label="Công cụ tính lương">
            <div className="calc-panel">
              <div className="calc-tabs">
                <button
                  className={mode === "grossToNet" ? "active" : ""}
                  onClick={() => setMode("grossToNet")}
                >
                  Gross → Net
                </button>
                <button
                  className={mode === "netToGross" ? "active" : ""}
                  onClick={() => setMode("netToGross")}
                >
                  Net → Gross
                </button>
                <button className="rule-select">
                  <CalendarDays size={15} />
                  Quy định từ 2026
                  <ChevronDown size={15} />
                </button>
              </div>

              <div className="form-grid">
                <MoneyField
                  label={mode === "grossToNet" ? "Lương gross" : "Lương net mong muốn"}
                  value={salary}
                  onChange={setSalary}
                />
                <label className="field">
                  <span>Vùng</span>
                  <select value={region} onChange={(event) => setRegion(event.target.value as Region)}>
                    {regionOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Người phụ thuộc</span>
                  <div className="stepper">
                    <button onClick={() => setDependents((value) => Math.max(0, value - 1))} aria-label="Giảm người phụ thuộc">
                      <Minus size={16} />
                    </button>
                    <strong>{dependents}</strong>
                    <button onClick={() => setDependents((value) => value + 1)} aria-label="Tăng người phụ thuộc">
                      <Plus size={16} />
                    </button>
                  </div>
                </label>
                <MoneyField
                  label="Lương đóng BHXH"
                  value={autoInsurance && mode === "grossToNet" ? salary : insuranceSalary}
                  onChange={setInsuranceSalary}
                  disabled={autoInsurance}
                />
              </div>

              <div className="slider-block">
                <div className="slider-head">
                  <span>Mức đóng bảo hiểm</span>
                  <label className="percent-input">
                    <input
                      type="number"
                      min={0}
                      max={200}
                      value={insurancePercent}
                      onChange={(event) => setInsurancePercent(Number(event.target.value))}
                    />
                    %
                  </label>
                </div>
                <input
                  aria-label="Mức đóng bảo hiểm"
                  className="range"
                  type="range"
                  min={0}
                  max={200}
                  step={5}
                  value={insurancePercent}
                  style={
                    {
                      "--progress": `${Math.min(Math.max(insurancePercent, 0), 200) / 2}%`,
                    } as CSSProperties
                  }
                  onChange={(event) => setInsurancePercent(Number(event.target.value))}
                />
                <div className="ticks">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                  <span>150%</span>
                  <span>200%</span>
                </div>
                <div className="switch-row">
                  <Toggle checked={autoInsurance} onChange={setAutoInsurance} label="Tự động theo lương" />
                  <Toggle checked={applyBounds} onChange={setApplyBounds} label="Áp trần/sàn 2026" />
                </div>
              </div>
            </div>

            <div className="result-panel">
              <div className="detail-list">
                <h2>Kết quả chi tiết</h2>
                <ResultRow icon={<ShieldCheck />} label="BHXH (8%)" value={result.socialInsurance} />
                <ResultRow icon={<WalletCards />} label="BHYT (1,5%)" value={result.healthInsurance} />
                <ResultRow icon={<BriefcaseBusiness />} label="BHTN (1%)" value={result.unemploymentInsurance} />
                <ResultRow icon={<Home />} label="Giảm trừ gia cảnh" value={result.familyDeduction} />
                <ResultRow icon={<BookOpen />} label="Thu nhập tính thuế" value={result.taxableIncome} />
                <ResultRow icon={<Sparkles />} label="Thuế TNCN" value={result.personalIncomeTax} danger />
              </div>

              <div className="net-card">
                <span>{primaryLabel}</span>
                <strong>{formatVnd(primaryAmount)}</strong>
                <small>
                  {mode === "grossToNet"
                    ? `Từ gross ${formatVnd(result.grossSalary)}`
                    : `Để nhận net ${formatVnd(result.netSalary)}`}
                </small>
                <button className="formula-button" onClick={() => setShowFormula((value) => !value)}>
                  Xem công thức tính <Info size={15} />
                </button>
                <div className="result-actions">
                  <button onClick={downloadResult}>
                    <Download size={16} />
                    Tải kết quả
                  </button>
                  <button onClick={shareResult}>
                    <Share2 size={16} />
                    Chia sẻ
                  </button>
                </div>
              </div>
            </div>

            {showFormula && <FormulaBox result={result} region={region} />}
          </section>
        </section>

        <section className="info-grid" id="legal">
          <InfoCard
            icon={<BookOpen />}
            title="Căn cứ pháp lý"
            items={[
              "Nghị định 293/2025/NĐ-CP",
              "Luật Bảo hiểm xã hội 41/2024/QH15",
              "Nghị quyết 110/2025/UBTVQH15",
              "Thông tư 111/2013/TT-BTC",
            ]}
            footer="Cập nhật: 06/2026"
          />
          <InfoCard
            icon={<Info />}
            title="Lưu ý quan trọng"
            items={[
              "Kết quả dùng để tham khảo nhanh.",
              "Có thể bật/tắt trần sàn bảo hiểm.",
              "Thu nhập đặc thù nên kiểm tra với kế toán hoặc cơ quan thuế.",
            ]}
          />
          <InfoCard
            icon={<Check />}
            title="Tại sao chọn công cụ này?"
            items={[
              "Tính nhanh trong vài giây",
              "Đầy đủ khoản đóng và khấu trừ",
              "Tự chỉnh mức đóng BHXH linh hoạt",
            ]}
          />
        </section>

        <section className="feature-band" id="guide">
          <h2>Công cụ dành cho mọi người</h2>
          <Feature icon={<Zap />} title="Nhanh & chính xác" text="Tính trong vài giây" />
          <Feature icon={<BriefcaseBusiness />} title="Đầy đủ & minh bạch" text="Hiển thị từng khoản" />
          <Feature icon={<SlidersHorizontal />} title="Tùy chỉnh linh hoạt" text="Điều chỉnh mức đóng BHXH" />
          <Feature icon={<Smartphone />} title="Tối ưu trên mobile" text="Trải nghiệm mượt mà" />
        </section>

        <section className="faq" id="faq">
          <h2>Câu hỏi thường gặp</h2>
          <p>
            Công cụ mặc định tính cho cá nhân cư trú ký hợp đồng lao động từ 3
            tháng trở lên, áp dụng biểu thuế lũy tiến từng phần và mức giảm trừ
            gia cảnh từ năm 2026.
          </p>
        </section>
      </div>
    </main>
  );
}

function MoneyField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="money-input">
        <input
          inputMode="numeric"
          value={value.toLocaleString("vi-VN")}
          onChange={(event) => onChange(parseVnd(event.target.value))}
          disabled={disabled}
        />
        <span>đ</span>
      </div>
    </label>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="toggle">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span aria-hidden="true" />
      {label}
    </label>
  );
}

function ResultRow({
  icon,
  label,
  value,
  danger,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <div className={danger ? "result-row danger" : "result-row"}>
      <span className="row-icon">{icon}</span>
      <span>{label}</span>
      <strong>{formatVnd(value)}</strong>
    </div>
  );
}

function FormulaBox({ result, region }: { result: SalaryResult; region: Region }) {
  return (
    <div className="formula-box">
      <h3>Công thức đang áp dụng</h3>
      <p>
        Net = Gross - BHXH - BHYT - BHTN - Thuế TNCN. Thu nhập tính thuế =
        Gross - tổng bảo hiểm - giảm trừ gia cảnh.
      </p>
      <div className="formula-grid">
        <span>Giảm trừ bản thân</span>
        <strong>{formatVnd(PERSONAL_DEDUCTION)}</strong>
        <span>Mỗi người phụ thuộc</span>
        <strong>{formatVnd(DEPENDENT_DEDUCTION)}</strong>
        <span>Tổng bảo hiểm NLĐ</span>
        <strong>{formatVnd(result.totalInsurance)}</strong>
        <span>Thuế sau lũy tiến</span>
        <strong>{formatVnd(result.personalIncomeTax)}</strong>
      </div>
      <p className="microcopy">
        Tỷ lệ NLĐ đóng: BHXH {EMPLOYEE_INSURANCE_RATES.social * 100}%, BHYT{" "}
        {EMPLOYEE_INSURANCE_RATES.health * 100}%, BHTN{" "}
        {EMPLOYEE_INSURANCE_RATES.unemployment * 100}%. Sàn vùng hiện chọn:{" "}
        {formatVnd(REGION_MINIMUM_WAGES[region])}.
      </p>
    </div>
  );
}

function TrustItem({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div>
      <span className="trust-icon">{icon}</span>
      <strong>{title}</strong>
      <small>{text}</small>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  items,
  footer,
}: {
  icon: ReactNode;
  title: string;
  items: string[];
  footer?: string;
}) {
  return (
    <article className="info-card">
      <h2>
        <span>{icon}</span>
        {title}
      </h2>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      {footer && <p>{footer}</p>}
    </article>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="feature">
      <span>{icon}</span>
      <div>
        <strong>{title}</strong>
        <small>{text}</small>
      </div>
    </div>
  );
}

export default App;
