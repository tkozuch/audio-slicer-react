export function DownloadLinks({ links }) {
  return (
    <div className="download-links" id="download-links">
      <ul>
        {links.map((link, index) => {
          return (
            <li>
              <a
                className="download-links__link"
                href={link.href}
                download={`${link.name}__slice-${index}.wav`}
                key={index}
              >
                {`${link.name}__slice-${index}.{link.extension}`}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
