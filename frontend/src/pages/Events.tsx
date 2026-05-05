import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { agentForEvent } from '../agents';

export function Events() {
  const [events, setEvents] = useState<any[]>([]);
  const [actionFilter, setActionFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const { collapsedSessions, setCollapsedSessions, sessionUsage, setSessionUsage } =
    useOutletContext<any>();
  const fetchedUsage = useRef<Set<string>>(new Set());

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-fetch usage for agents that expose session transcript usage.
  useEffect(() => {
    const seen = new Map<string, string>();
    events.forEach(e => {
      const agent = agentForEvent(e);
      if (agent.supportsSessionUsage && e.transcript_path && e.session && !seen.has(e.session))
        seen.set(e.session, e.transcript_path);
    });
    seen.forEach((path, key) => fetchUsage(path, key));
  }, [events]);

  const fetchUsage = async (transcriptPath: string, sessionKey: string) => {
    if (!transcriptPath || fetchedUsage.current.has(sessionKey)) return;
    fetchedUsage.current.add(sessionKey);
    try {
      const res = await fetch(`/api/session-usage?path=${encodeURIComponent(transcriptPath)}`);
      const data = await res.json();
      setSessionUsage((prev: any) => ({ ...prev, [sessionKey]: data }));
    } catch (e) { fetchedUsage.current.delete(sessionKey); }
  };

  const fmtTokens = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      setEvents(data.events || []);
    } catch (e) {}
  };

  const toggleSession = (sessionId: string) => {
    setCollapsedSessions((prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(sessionId)) next.delete(sessionId);
      else next.add(sessionId);
      return next;
    });
  };

  const shortId = (v: string) => v ? v.substring(0, 8) : 'unknown';
  const groupKey = (e: any) => e.session || e.transcript_path || 'ungrouped';

  const renderDiffLines = (oldStr: string, newStr: string, startLine: number, ctxBefore: any[], ctxAfter: any[]) => {
    const oldLines = oldStr.split('\n');
    const newLines = newStr.split('\n');
    const base = startLine > 0 ? startLine : 1;
    return (
      <div className="diff-block">
        {ctxBefore?.map((l: any) => (
          <div key={`ctx-b-${l.num}`} className="diff-line diff-ctx">
            <span className="diff-ln">{l.num}</span>
            <span className="diff-marker"> </span>
            <span className="diff-content">{l.text}</span>
          </div>
        ))}
        {oldLines.map((line, i) => (
          <div key={`rm-${i}`} className="diff-line diff-removed">
            <span className="diff-ln">{base + i}</span>
            <span className="diff-marker">-</span>
            <span className="diff-content">{line}</span>
          </div>
        ))}
        {newLines.map((line, i) => (
          <div key={`add-${i}`} className="diff-line diff-added">
            <span className="diff-ln">{base + i}</span>
            <span className="diff-marker">+</span>
            <span className="diff-content">{line}</span>
          </div>
        ))}
        {ctxAfter?.map((l: any) => (
          <div key={`ctx-a-${l.num}`} className="diff-line diff-ctx">
            <span className="diff-ln">{l.num}</span>
            <span className="diff-marker"> </span>
            <span className="diff-content">{l.text}</span>
          </div>
        ))}
      </div>
    );
  };

  const highlight = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^$(){}|[\\]\\\\]/g, '\\$&')})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() 
            ? <mark key={i}>{part}</mark> 
            : part
        )}
      </>
    );
  };

  // Grouping and Filtering
  const filtered = events.filter(e => {
    if (actionFilter !== 'all' && e.action !== actionFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!e.path?.toLowerCase().includes(q) && 
          !e.session?.toLowerCase().includes(q) && 
          !e.command?.toLowerCase().includes(q) &&
          !e.prompt?.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  const grouped = new Map<string, any[]>();
  filtered.forEach(e => {
    const key = groupKey(e);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(e);
  });

  const sessionList = Array.from(grouped.keys()).map(key => {
    const groupEvents = grouped.get(key)!;
    const sortedEvents = groupEvents.sort((a, b) => 
      sortOrder === 'newest' 
        ? new Date(b.time).getTime() - new Date(a.time).getTime()
        : new Date(a.time).getTime() - new Date(b.time).getTime()
    );
    const lastTime = new Date(Math.max(...sortedEvents.map(e => new Date(e.time).getTime())));
    return { key, events: sortedEvents, lastTime };
  });

  sessionList.sort((a, b) => 
    sortOrder === 'newest' 
      ? b.lastTime.getTime() - a.lastTime.getTime()
      : a.lastTime.getTime() - b.lastTime.getTime()
  );

  return (
    <>
      {tooltip && (
        <div className="floating-tip" style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}>
          {tooltip.text.split('\n').map((line, i) => <div key={i}>{line}</div>)}
        </div>
      )}
      <div className="toolbar">
        <div className="tg">
          <span className="tl">Action</span>
          <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
            <option value="all">ALL</option>
            <option value="EDIT">EDIT</option>
            <option value="BASH">BASH</option>
          </select>
        </div>
        <div className="tg" style={{ flex: 1 }}>
          <span className="tl">Search</span>
          <input 
            placeholder="Filter by path, prompt, or session ID..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="tg">
          <span className="tl">Sort</span>
          <select value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
            <option value="newest">NEWEST</option>
            <option value="oldest">OLDEST</option>
          </select>
        </div>
      </div>
      <div className="main">
        <div className="panel" style={{ borderRight: 'none' }}>
          <div className="ph">Session Events</div>
          <div className="pb">
            {sessionList.length === 0 ? (
              <div style={{ color: 'var(--dim)', fontStyle: 'italic', padding: '10px' }}>
                No matching events.
              </div>
            ) : sessionList.map(({ key, events, lastTime }) => {
              const e0 = events[0];
              const sessionModel = events.find(e => e.model)?.model;
              const isCollapsed = collapsedSessions.has(key);
              const agent = agentForEvent(e0);
              
              return (
                <div key={key} className={`session ${isCollapsed ? 'collapsed' : ''}`}>
                  <div className="session-head" onClick={() => toggleSession(key)}>
                    <div className="session-id">
                      {highlight(e0.session || shortId(e0.transcript_path), searchQuery)}
                      <span className="chev">{isCollapsed ? '▼' : '▲'}</span>
                    </div>
                    <div className="session-meta">
                      <span className={`agent-badge agent-${agent.badgeClass}`}>
                        {agent.label}
                      </span>
                      {sessionModel && <span style={{ marginLeft: '8px', marginRight: '10px' }}>{sessionModel}</span>}
                      {sessionUsage[key] && agent.buildUsageItems && (() => {
                        const u = sessionUsage[key];
                        return (
                          <span className="usage-summary">
                            {agent.buildUsageItems(u, fmtTokens).map(({ cls, label, tip }) => (
                              <span
                                key={cls}
                                className={`usage-item ${cls}`}
                                onMouseEnter={ev => setTooltip({ text: tip, x: ev.clientX, y: ev.clientY })}
                                onMouseMove={ev => setTooltip(t => t ? { ...t, x: ev.clientX, y: ev.clientY } : null)}
                                onMouseLeave={() => setTooltip(null)}
                              >{label}</span>
                            ))}
                          </span>
                        );
                      })()}
                      {events.length} events • {lastTime.toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="session-body">
                    {events.map((e, i) => (
                      <div key={i} className="event">
                        <div className="et">{new Date(e.time).toLocaleTimeString([], { hour12: false })}</div>
                        <div className={`ea ${e.action}`}>{e.action}</div>
                        <div className="ep">
                          <div>
                            {e.hook_event_name && <span className={`hook hook-${e.hook_event_name}`}>{e.hook_event_name}</span>}
                            {e.action !== 'BASH' && highlight(e.path || '', searchQuery)}
                          </div>

                          {(e.prompt || e.command) && (
                            <div className="eblock">
                              <strong>{e.prompt ? 'Prompt' : 'Shell'}</strong>
                              <pre>
                                {highlight(e.prompt || e.command || '', searchQuery)}
                              </pre>
                            </div>
                          )}

                          {e.action === 'EDIT' && e.old_string && e.new_string && (() => {
                            return (
                              <div className="eblock eblock-diff">
                                <strong>Changes</strong>
                                {renderDiffLines(e.old_string, e.new_string, e.start_line, e.ctx_before, e.ctx_after)}
                              </div>
                            );
                          })()}

                          <div className="meta">
                            {e.tool && <span><strong>Tool:</strong> {e.tool}</span>}
                            {e.source && <span><strong>Source:</strong> {e.source}</span>}
                            {e.turn_id && <span><strong>Turn:</strong> {shortId(e.turn_id)}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
