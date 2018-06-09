// force Prism into manual mode _before_ importing it
import "./config";
import Prism from "prismjs";

// expose Prism to support language extensions
// being registered from separate scripts
global.Prism = Prism;

export default Prism;
