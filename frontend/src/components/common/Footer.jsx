import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFacebookF,
  faInstagram,
  faLinkedinIn,
} from "@fortawesome/free-brands-svg-icons";

function Footer() {
  const footerColumns = [
    {
      title: "Top Categories",
      items: ["Web Development", "Data Science", "Cloud Engineering", "Design"],
    },
    {
      title: "Career Tracks",
      items: ["Backend Developer", "AI Engineer", "DevOps Engineer", "Product Analyst"],
    },
    {
      title: "Platform",
      items: ["About Us", "Teach on EduVerse", "Contact", "Help & Support"],
    },
  ];

  return (
    <footer className="udemy-footer">
      <div className="udemy-footer-inner">
        <div className="udemy-footer-grid">
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3>{column.title}</h3>
              <ul>
                {column.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="udemy-footer-bottom">
          <p>© {new Date().getFullYear()} EduVerse. All rights reserved.</p>
          <div className="udemy-socials" aria-label="Social links">
            <Link to="/">
              <FontAwesomeIcon icon={faFacebookF} />
            </Link>
            <Link to="/">
              <FontAwesomeIcon icon={faInstagram} />
            </Link>
            <Link to="/">
              <FontAwesomeIcon icon={faLinkedinIn} />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
