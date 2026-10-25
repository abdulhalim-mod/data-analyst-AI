
import { useState } from "react";
import axios from "axios";
import {
  Activity,
  BrainCircuit,
  ChartNoAxesCombined,
  CheckCircle2,
  ChevronRight,
  Database,
  FileSpreadsheet,
  MessageSquare,
  RefreshCw,
  Send,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import "./App.css";

const API = "http://127.0.0.1:8000";

function App() {
  const [file, setFile] = useState(null);
  const [datasetId, setDatasetId] = useState("");
  const [report, setReport] = useState(null);
  const [insights, setInsights] = useState(null);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  function chooseFile(selectedFile) {
    if (!selectedFile) return;

    const extension = selectedFile.name.split(".").pop().toLowerCase();
    if (!["csv", "xlsx", "xls"].includes(extension)) {
      setError("Please choose a CSV or Excel file.");
      return;
    }

    setFile(selectedFile);
    setError("");
  }

  async function uploadDataset() {
    if (!file) {
      setError("Choose a CSV or Excel file first.");
      return;
    }

    setLoading(true);
    setError("");
    setReport(null);
    setInsights(null);
    setMessages([]);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(`${API}/api/upload`, formData);
      const id =
        response.data.dataset_id ||
        response.data.id;

      if (!id) {
        throw new Error("The upload response did not include a dataset ID.");
      }

      setDatasetId(id);

      const reportResponse = await axios.get(
        `${API}/api/report/${id}`
      );
      setReport(reportResponse.data);

      try {
        const insightResponse = await axios.get(
          `${API}/api/insights/${id}`
        );
        setInsights(insightResponse.data);
      } catch {
        setInsights(null);
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Upload failed. Check that your backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  async function askQuestion(event) {
    event.preventDefault();
    if (!question.trim() || !datasetId || asking) return;

    const userQuestion = question.trim();
    setQuestion("");
    setMessages((previous) => [
      ...previous,
      { role: "user", content: userQuestion },
    ]);
    setAsking(true);

    try {
      const response = await axios.post(`${API}/api/ask`, {
        dataset_id: datasetId,
        question: userQuestion,
      });

      const answer =
        response.data.answer ||
        response.data.response ||
        response.data.message ||
        JSON.stringify(response.data);

      setMessages((previous) => [
        ...previous,
        { role: "assistant", content: String(answer) },
      ]);
    } catch (err) {
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content:
            err.response?.data?.detail ||
            "Couldn't get an answer. Please check the backend.",
        },
      ]);
    } finally {
      setAsking(false);
    }
  }

  function resetWorkspace() {
    setFile(null);
    setDatasetId("");
    setReport(null);
    setInsights(null);
    setMessages([]);
    setQuestion("");
    setError("");
  }

  const summary =
    report?.summary ||
    report?.statistics ||
    report?.profile ||
    report ||
    {};

  const rows =
    report?.preview ||
    report?.data_preview ||
    report?.head ||
    report?.sample_data ||
    [];

  const numericStats =
    report?.numeric_summary ||
    report?.numeric_statistics ||
    report?.describe ||
    {};

  const rowCount =
    summary?.rows ??
    summary?.row_count ??
    summary?.total_rows ??
    report?.row_count ??
    report?.total_rows ??
    (Array.isArray(rows) ? rows.length : "—");

  const columnCount =
    summary?.columns ??
    summary?.column_count ??
    summary?.total_columns ??
    report?.column_count ??
    report?.total_columns ??
    (Array.isArray(report?.columns) ? report.columns.length : "—");

  const columns =
    report?.columns ||
    report?.column_names ||
    (Array.isArray(rows) && rows.length
      ? Object.keys(rows[0])
      : []);

  const numericColumns = Object.keys(numericStats || {});

  const chartData = numericColumns.slice(0, 6).map((key) => {
    const item = numericStats[key] || {};
    return {
      name: key,
      mean: Number(item.mean ?? item.avg ?? 0) || 0,
    };
  });

  function findInsightText(data) {
    if (!data) return "";
    if (typeof data === "string") return data;
    if (Array.isArray(data)) {
      return data
        .map((item) =>
          typeof item === "string"
            ? item
            : item.text || item.insight || item.message || JSON.stringify(item)
        )
        .join("\n\n");
    }

    return (
      data.insights ||
      data.answer ||
      data.summary ||
      data.report ||
      data.message ||
      ""
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Activity size={23} />
          </div>
          <div>
            <div className="brand-name">OBSERVATORY<span>.</span></div>
            <div className="brand-caption">INTELLIGENCE WORKSPACE</div>
          </div>
        </div>

        <div className="sidebar-label">WORKSPACE</div>
        <button className="nav-item active">
          <ChartNoAxesCombined size={18} />
          <span>Overview</span>
          <span className="nav-dot" />
        </button>
        <button
          className="nav-item"
          onClick={() =>
            document
              .getElementById("dataset-section")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        >
          <Database size={18} />
          <span>Dataset explorer</span>
        </button>
        <button
          className="nav-item"
          onClick={() =>
            document
              .getElementById("insights-section")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        >
          <BrainCircuit size={18} />
          <span>AI intelligence</span>
        </button>
        <button
          className="nav-item"
          onClick={() =>
            document
              .getElementById("chat-section")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        >
          <MessageSquare size={18} />
          <span>Ask your data</span>
        </button>

        <div className="sidebar-bottom">
          <div className="system-status">
            <span className="status-light" />
            <div>
              <div className="status-title">Analysis engine</div>
              <div className="status-subtitle">Workspace ready</div>
            </div>
          </div>
          <div className="sidebar-footer">
            <span>DATA OBSERVATORY</span>
            <span>V1.0</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>Overview</strong>
          </div>
          <div className="topbar-right">
            <span className="live-status">
              <span className="status-light" />
              SYSTEM ONLINE
            </span>
            <div className="avatar">DA</div>
          </div>
        </header>

        <div className="page-content">
          <section className="hero-section">
            <div className="hero-copy">
              <div className="eyebrow">
                <span className="eyebrow-line" />
                YOUR PERSONAL DATA LAB
              </div>
              <h1>
                Your data.
                <br />
                <span>Decoded.</span>
              </h1>
              <p>
                Turn raw numbers into meaningful discoveries.
                Upload a dataset and let intelligence do the heavy lifting.
              </p>
              <div className="hero-meta">
                <span><CheckCircle2 size={15} /> CSV & Excel supported</span>
                <span><Sparkles size={15} /> Gemini-powered analysis</span>
              </div>
            </div>

            <div className="hero-art" aria-hidden="true">
              <div className="orbit orbit-one" />
              <div className="orbit orbit-two" />
              <div className="orbit orbit-three" />
              <div className="orbit-core">
                <ChartNoAxesCombined size={43} strokeWidth={1.4} />
              </div>
              <div className="floating-chip chip-top">
                <span className="chip-dot lime-dot" /> PATTERN DETECTED
              </div>
              <div className="floating-chip chip-bottom">
                <Activity size={15} /> LIVE ANALYTICS
              </div>
              <div className="art-cross cross-one">+</div>
              <div className="art-cross cross-two">+</div>
            </div>
          </section>

          <section className="upload-panel" id="dataset-section">
            <div className="section-heading">
              <div>
                <div className="section-kicker">01 / INGESTION</div>
                <h2>Bring your data in.</h2>
                <p>One file is all it takes to get started.</p>
              </div>
              {datasetId && (
                <button className="text-button" onClick={resetWorkspace}>
                  <RefreshCw size={15} /> New dataset
                </button>
              )}
            </div>

            <div
              className={`dropzone ${dragging ? "dragging" : ""} ${
                file ? "has-file" : ""
              }`}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                chooseFile(event.dataTransfer.files?.[0]);
              }}
            >
              <input
                id="file-input"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(event) =>
                  chooseFile(event.target.files?.[0])
                }
              />
              <div className="upload-icon">
                {file ? (
                  <FileSpreadsheet size={25} />
                ) : (
                  <Upload size={25} />
                )}
              </div>
              <div className="dropzone-copy">
                <strong>
                  {file ? file.name : "Drop your dataset here"}
                </strong>
                <span>
                  {file
                    ? "Ready for analysis"
                    : "or browse files from your computer"}
                </span>
              </div>
              <label htmlFor="file-input" className="browse-button">
                Browse files
              </label>
              {file && (
                <button
                  className="remove-file"
                  aria-label="Remove selected file"
                  onClick={() => setFile(null)}
                >
                  <X size={17} />
                </button>
              )}
            </div>

            <div className="upload-bottom">
              <span><CheckCircle2 size={14} /> Your data stays in your workspace</span>
              <button
                className="primary-button"
                onClick={uploadDataset}
                disabled={!file || loading}
              >
                {loading ? (
                  <><RefreshCw className="spin" size={16} /> Analysing...</>
                ) : (
                  <><Sparkles size={16} /> Analyse dataset <ChevronRight size={16} /></>
                )}
              </button>
            </div>

            {error && <div className="error-message">{error}</div>}
          </section>

          <section className="metrics-grid">
            <div className="metric-card">
              <div className="metric-top">
                <span className="metric-label">TOTAL RECORDS</span>
                <div className="metric-icon"><Database size={18} /></div>
              </div>
              <div className="metric-value">{rowCount}</div>
              <div className="metric-foot">Rows in current dataset</div>
            </div>
            <div className="metric-card">
              <div className="metric-top">
                <span className="metric-label">DATA FIELDS</span>
                <div className="metric-icon lime-icon"><ChartNoAxesCombined size={18} /></div>
              </div>
              <div className="metric-value">{columnCount}</div>
              <div className="metric-foot">Columns identified</div>
            </div>
            <div className="metric-card">
              <div className="metric-top">
                <span className="metric-label">NUMERIC SIGNALS</span>
                <div className="metric-icon"><Activity size={18} /></div>
              </div>
              <div className="metric-value">{numericColumns.length || "—"}</div>
              <div className="metric-foot">Numeric fields detected</div>
            </div>
            <div className="metric-card">
              <div className="metric-top">
                <span className="metric-label">AI STATUS</span>
                <div className="metric-icon lime-icon"><BrainCircuit size={18} /></div>
              </div>
              <div className="metric-value status-value">
                <span className="status-light" />
                {datasetId ? "Analysed" : "Standby"}
              </div>
              <div className="metric-foot">
                {datasetId ? "Dataset is loaded" : "Waiting for dataset"}
              </div>
            </div>
          </section>

          <section className="analysis-grid">
            <div className="content-card chart-card">
              <div className="card-heading">
                <div>
                  <div className="section-kicker">02 / SIGNALS</div>
                  <h3>Inside your numbers</h3>
                </div>
                <span className="card-tag">NUMERIC OVERVIEW</span>
              </div>
              {chartData.length > 0 ? (
                <div className="chart-wrap">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartData} margin={{ top: 12, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 5" stroke="#263630" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: "#91A49B", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#91A49B", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: "#17231E",
                          border: "1px solid #34483D",
                          borderRadius: 10,
                          color: "#F1F4EC",
                        }}
                      />
                      <Bar dataKey="mean" fill="#A6E65B" radius={[5, 5, 0, 0]} maxBarSize={45} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="chart-caption">
                    <span><span className="legend-dot" /> Mean value per numeric field</span>
                    <span>{chartData.length} fields</span>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon"><ChartNoAxesCombined size={25} /></div>
                  <strong>Your numbers will appear here.</strong>
                  <span>Upload a dataset to reveal its numeric patterns.</span>
                </div>
              )}
            </div>

            <div className="content-card insight-card" id="insights-section">
              <div className="card-heading">
                <div>
                  <div className="section-kicker">03 / INTELLIGENCE</div>
                  <h3>What stands out?</h3>
                </div>
                <div className="gemini-mark"><Sparkles size={17} /></div>
              </div>
              {insights ? (
                <div className="insight-content">
                  <div className="insight-badge"><span className="status-light" /> AI ANALYSIS READY</div>
                  <p>{findInsightText(insights) || JSON.stringify(insights, null, 2)}</p>
                </div>
              ) : (
                <div className="empty-state compact">
                  <div className="empty-icon"><BrainCircuit size={24} /></div>
                  <strong>Waiting for a signal.</strong>
                  <span>Upload a dataset to generate AI-powered insights.</span>
                </div>
              )}
            </div>
          </section>

          <section className="content-card table-card">
            <div className="card-heading">
              <div>
                <div className="section-kicker">04 / EXPLORER</div>
                <h3>Raw data, in focus.</h3>
              </div>
              <span className="card-tag">
                {Array.isArray(rows) ? `${rows.length} PREVIEW ROWS` : "DATA PREVIEW"}
              </span>
            </div>
            {Array.isArray(rows) && rows.length > 0 ? (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      {(columns.length ? columns : Object.keys(rows[0])).map((column) => (
                        <th key={column}>{column}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => (
                      <tr key={index}>
                        {(columns.length ? columns : Object.keys(row)).map((column) => (
                          <td key={column}>{String(row[column] ?? "—")}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state table-empty">
                <FileSpreadsheet size={26} />
                <strong>No dataset loaded yet</strong>
                <span>Your data preview will show up here after upload.</span>
              </div>
            )}
          </section>

          <section className="content-card chat-card" id="chat-section">
            <div className="card-heading">
              <div>
                <div className="section-kicker">05 / CONVERSATION</div>
                <h3>Ask your data.</h3>
                <p className="card-subtitle">Plain English in. Useful answers out.</p>
              </div>
              <div className="chat-icon"><MessageSquare size={20} /></div>
            </div>

            <div className="chat-messages">
              {messages.length === 0 ? (
                <div className="chat-welcome">
                  <div className="chat-welcome-icon"><Sparkles size={20} /></div>
                  <div>
                    <strong>Start with a question.</strong>
                    <p>Try “Which product has the highest sales?” or “Summarise this dataset.”</p>
                  </div>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div className={`chat-message ${message.role}`} key={index}>
                    <div className="message-role">
                      {message.role === "user" ? "YOU" : "OBSERVATORY AI"}
                    </div>
                    <p>{message.content}</p>
                  </div>
                ))
              )}
              {asking && (
                <div className="chat-message assistant">
                  <div className="message-role">OBSERVATORY AI</div>
                  <p className="thinking"><span /> <span /> <span /></p>
                </div>
              )}
            </div>

            <form className="chat-form" onSubmit={askQuestion}>
              <input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder={
                  datasetId
                    ? "Ask anything about your dataset..."
                    : "Upload a dataset to start asking questions..."
                }
                disabled={!datasetId || asking}
              />
              <button type="submit" disabled={!datasetId || !question.trim() || asking}>
                <Send size={17} />
                <span>Ask AI</span>
              </button>
            </form>
            <div className="chat-footnote">
              <Sparkles size={13} /> Powered by Gemini · Answers are based on your uploaded dataset
            </div>
          </section>

          <footer className="page-footer">
            <div className="footer-brand"><Activity size={15} /> DATA OBSERVATORY</div>
            <span>Built to make data more human.</span>
            <span>AI-POWERED ANALYTICS</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default App;
