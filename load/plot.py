from pathlib import Path
import argparse
import re

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd


RESULT_DIR = Path(__file__).resolve().parent / "result"
DEFAULT_CSV = RESULT_DIR / "result.csv"


def resolve_csv_path(file_name: str | None) -> Path:
    if file_name:
        csv_path = Path(file_name)
        if not csv_path.is_absolute():
            csv_path = RESULT_DIR / csv_path
        return csv_path

    if DEFAULT_CSV.exists():
        return DEFAULT_CSV

    csv_files = sorted(RESULT_DIR.glob("*.csv"))
    if len(csv_files) == 1:
        return csv_files[0]
    if not csv_files:
        raise FileNotFoundError(f"No CSV files found in {RESULT_DIR}")

    names = ", ".join(file.name for file in csv_files)
    raise ValueError(f"Several CSV files found in {RESULT_DIR}: {names}. Pass a file name explicitly.")


def read_results(csv_path: Path) -> pd.DataFrame:
    if not csv_path.exists():
        raise FileNotFoundError(f"CSV file not found: {csv_path}")

    data = pd.read_csv(csv_path)

    required_columns = {"label", "Latency"}
    missing_columns = required_columns - set(data.columns)
    if missing_columns:
        missing = ", ".join(sorted(missing_columns))
        raise ValueError(f"CSV file is missing required columns: {missing}")

    data = data.copy()
    data["Config"] = data["label"].str.extract(r"(Config\s*#\d+)", expand=False)
    data = data.dropna(subset=["Config", "Latency"])
    data["Latency"] = pd.to_numeric(data["Latency"], errors="coerce")
    data = data.dropna(subset=["Latency"])

    if data.empty:
        raise ValueError("CSV file does not contain latency rows with Config labels")

    return data


def config_sort_key(config: str) -> tuple[int, str]:
    match = re.search(r"#(\d+)", config)
    if match:
        return int(match.group(1)), config
    return np.iinfo(np.int32).max, config


def plot_latency(data: pd.DataFrame) -> None:
    fig, ax = plt.subplots(figsize=(12, 7))

    for config, group in sorted(data.groupby("Config"), key=lambda item: config_sort_key(item[0])):
        x = np.arange(1, len(group) + 1)
        ax.plot(x, group["Latency"].to_numpy(), marker="o", linewidth=1.5, markersize=3, label=config)

    ax.set_title("Latency by Config")
    ax.set_xlabel("Request number")
    ax.set_ylabel("Latency, ms")
    ax.grid(True, linestyle="--", alpha=0.4)
    ax.legend(title="Config")
    fig.tight_layout()
    plt.show()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Plot latency for each Config from load/result CSV data.")
    parser.add_argument(
        "csv",
        nargs="?",
        help="CSV file name from load/result, or an absolute/relative path. Defaults to load/result/result.csv.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    csv_path = resolve_csv_path(args.csv)
    data = read_results(csv_path)
    plot_latency(data)


if __name__ == "__main__":
    main()
