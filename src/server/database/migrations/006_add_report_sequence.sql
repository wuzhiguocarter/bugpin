-- 加 report 序号字段（per project 自增），便于 PM 沟通时引用「MIGE-7」这种短编号。
-- lula 2026-06-01

-- 1. 加列（nullable，回填后再考虑约束）
ALTER TABLE reports ADD COLUMN seq INTEGER;

-- 2. 回填：每个 project_id 内按 created_at, id 排序，从 1 开始递增
-- 用相关子查询统计每行的「同 project 内 created_at <= 自己 的 report 数量」作为 seq
UPDATE reports
SET seq = (
  SELECT COUNT(*)
  FROM reports r2
  WHERE r2.project_id = reports.project_id
    AND (
      r2.created_at < reports.created_at
      OR (r2.created_at = reports.created_at AND r2.id <= reports.id)
    )
);

-- 3. 唯一索引：同 project 内 seq 不可重复（防止并发 race / bug 重复发号）
CREATE UNIQUE INDEX IF NOT EXISTS uk_reports_project_seq ON reports(project_id, seq);

-- 4. 普通查询索引（按 project + seq 排序）
CREATE INDEX IF NOT EXISTS idx_reports_project_seq ON reports(project_id, seq);
