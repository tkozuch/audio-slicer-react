export function DownloadLinks({ links }) {
  return (
    <div className="download-links" id="download-links">
      {links.map((link, index) => {
        return (
          <a
            className="download-links__link"
            href={link.href}
            download={`${link.name}__slice-${index}.wav`}
            key={index}
          >
            {`${link.name}__slice-${index}.{link.extension}`}
          </a>
        );
      })}
    </div>
  );
}
