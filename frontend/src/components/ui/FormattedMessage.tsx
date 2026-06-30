import React from "react";

interface FormattedMessageProps {
  text: string;
  isFromMe?: boolean;
}

export const FormattedMessage: React.FC<FormattedMessageProps> = ({ text, isFromMe }) => {
  if (!text) return null;

  const linkColor = isFromMe ? "#FFFFFF" : "#0866FF";
  const codeBg = isFromMe ? "rgba(255,255,255,0.12)" : "#F0F2F5";

  const tokens: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  const regex = /(\*)(.+?)\1(?![*])|_(.+?)_(?=\s|[.,!?;]|$)|~(.+?)~|(`+)(.+?)\5|(https?:\/\/[^\s<]+)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(remaining)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(<span key={key++}>{remaining.slice(lastIndex, match.index)}</span>);
    }

    if (match[1] === "*" && match[2]) {
      tokens.push(<strong key={key++} style={{ fontWeight: 700 }}>{match[2]}</strong>);
    } else if (match[3]) {
      tokens.push(<em key={key++} style={{ fontStyle: "italic" }}>{match[3]}</em>);
    } else if (match[4]) {
      tokens.push(<del key={key++} style={{ textDecoration: "line-through" }}>{match[4]}</del>);
    } else if (match[5] && match[6]) {
      tokens.push(
        <code key={key++}
          style={{
            fontFamily: "SFMono-Regular, Consolas, monospace",
            fontSize: "13px",
            backgroundColor: codeBg,
            padding: "1px 5px",
            borderRadius: 4,
            wordBreak: "break-word",
          }}
        >{match[6]}</code>
      );
    } else if (match[7]) {
      const url = match[7];
      tokens.push(
        <a key={key++} href={url} target="_blank" rel="noopener noreferrer"
          style={{ color: linkColor, textDecoration: "underline", wordBreak: "break-all" }}>
          {url}
        </a>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < remaining.length) {
    tokens.push(<span key={key++}>{remaining.slice(lastIndex)}</span>);
  }

  if (tokens.length === 0) {
    return <>{text}</>;
  }

  return <>{tokens}</>;
};
