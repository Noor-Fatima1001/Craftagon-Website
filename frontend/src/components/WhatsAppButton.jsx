export default function WhatsAppButton({ url, children, className = 'btn-primary' }) {
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noreferrer" className={className}>
      {children || 'Open WhatsApp'}
    </a>
  );
}
