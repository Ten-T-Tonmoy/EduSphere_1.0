import React, { useRef, useState } from 'react';
// FIXED: Using the modern React 18+ compatible package
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

import EmojiPicker from 'emoji-picker-react';
import { ChromePicker } from 'react-color';

const CustomToolbar = ({ onEmojiClick, onColorChange }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  return (
    <div id="toolbar" className="flex flex-wrap items-center gap-1 p-2 bg-gray-100 rounded-t-lg border-b border-gray-300 sticky top-0 z-10">
      <select className="ql-font ql-picker text-sm border rounded px-2 py-1">
        <option value="sans-serif">Sans Serif</option>
        <option value="serif">Serif</option>
        <option value="monospace">Monospace</option>
        <option value="arial">Arial</option>
        <option value="verdana">Verdana</option>
        <option value="helvetica">Helvetica</option>
        <option value="times">Times New Roman</option>
        <option value="georgia">Georgia</option>
        <option value="courier">Courier New</option>
        <option value="tahoma">Tahoma</option>
        <option value="trebuchet">Trebuchet MS</option>
        <option value="comic">Comic Sans MS</option>
        <option value="impact">Impact</option>
        <option value="roboto">Roboto</option>
        <option value="opensans">Open Sans</option>
        <option value="lato">Lato</option>
        <option value="montserrat">Montserrat</option>
        <option value="poppins">Poppins</option>
        <option value="raleway">Raleway</option>
        <option value="ubuntu">Ubuntu</option>
        <option value="oswald">Oswald</option>
        <option value="merriweather">Merriweather</option>
        <option value="playfair">Playfair Display</option>
        <option value="sourcesans">Source Sans Pro</option>
        <option value="nunito">Nunito</option>
        <option value="quicksand">Quicksand</option>
        <option value="firasans">Fira Sans</option>
        <option value="inconsolata">Inconsolata</option>
        <option value="dancing">Dancing Script</option>
        <option value="pacifico">Pacifico</option>
        <option value="shadows">Shadows Into Light</option>
        <option value="indie">Indie Flower</option>
        <option value="caveat">Caveat</option>
        <option value="amatic">Amatic SC</option>
        <option value="architects">Architects Daughter</option>
        <option value="fredoka">Fredoka One</option>
        <option value="bangers">Bangers</option>
        <option value="lobster">Lobster</option>
        <option value="righteous">Righteous</option>
        <option value="abril">Abril Fatface</option>
        <option value="acme">Acme</option>
        <option value="alfa">Alfa Slab One</option>
        <option value="anton">Anton</option>
        <option value="bebas">Bebas Neue</option>
        <option value="bitter">Bitter</option>
        <option value="cabin">Cabin</option>
        <option value="cairo">Cairo</option>
        <option value="carter">Carter One</option>
        <option value="catamaran">Catamaran</option>
        <option value="changa">Changa</option>
        <option value="concert">Concert One</option>
        <option value="courgette">Courgette</option>
        <option value="creepster">Creepster</option>
        <option value="dmsans">DM Sans</option>
        <option value="exo2">Exo 2</option>
        <option value="fjalla">Fjalla One</option>
        <option value="francois">Francois One</option>
        <option value="gloria">Gloria Hallelujah</option>
        <option value="gothic">Gothic A1</option>
        <option value="greatvibes">Great Vibes</option>
        <option value="hind">Hind</option>
        <option value="josefin">Josefin Sans</option>
        <option value="jost">Jost</option>
        <option value="kalam">Kalam</option>
        <option value="karla">Karla</option>
        <option value="libre">Libre Baskerville</option>
        <option value="lilita">Lilita One</option>
        <option value="mplus">M PLUS Rounded 1c</option>
        <option value="manrope">Manrope</option>
        <option value="marck">Marck Script</option>
        <option value="maven">Maven Pro</option>
        <option value="mukta">Mukta</option>
        <option value="mulish">Mulish</option>
        <option value="nanum">Nanum Gothic</option>
        <option value="neucha">Neucha</option>
        <option value="noto">Noto Sans</option>
        <option value="notoserif">Noto Serif</option>
        <option value="orbitron">Orbitron</option>
        <option value="overpass">Overpass</option>
        <option value="oxygen">Oxygen</option>
        <option value="patrick">Patrick Hand</option>
        <option value="paytone">Paytone One</option>
        <option value="permanent">Permanent Marker</option>
        <option value="philosopher">Philosopher</option>
        <option value="prata">Prata</option>
        <option value="prompt">Prompt</option>
        <option value="questrial">Questrial</option>
        <option value="rajdhani">Rajdhani</option>
        <option value="redhat">Red Hat Display</option>
        <option value="robotocondensed">Roboto Condensed</option>
        <option value="robotomono">Roboto Mono</option>
        <option value="rubik">Rubik</option>
        <option value="saira">Saira</option>
        <option value="satisfy">Satisfy</option>
        <option value="secular">Secular One</option>
        <option value="signika">Signika</option>
        <option value="slabo">Slabo 27px</option>
        <option value="sourcecode">Source Code Pro</option>
        <option value="spacegrotesk">Space Grotesk</option>
        <option value="spacemono">Space Mono</option>
        <option value="spartan">Spartan</option>
        <option value="spectral">Spectral</option>
        <option value="staatliches">Staatliches</option>
        <option value="titillium">Titillium Web</option>
        <option value="ubuntucondensed">Ubuntu Condensed</option>
        <option value="varela">Varela Round</option>
        <option value="worksans">Work Sans</option>
        <option value="yanone">Yanone Kaffeesatz</option>
        <option value="zilla">Zilla Slab</option>
      </select>

      <select className="ql-size text-sm border rounded px-2 py-1">
        <option value="small">Small</option>
        <option value="false">Normal</option>
        <option value="large">Large</option>
        <option value="huge">Huge</option>
      </select>

      <button className="ql-bold" title="Bold"><i className="fas fa-bold"></i></button>
      <button className="ql-italic" title="Italic"><i className="fas fa-italic"></i></button>
      <button className="ql-underline" title="Underline"><i className="fas fa-underline"></i></button>
      <button className="ql-strike" title="Strikethrough"><i className="fas fa-strikethrough"></i></button>
      <button className="ql-color" title="Text Color"><i className="fas fa-palette"></i></button>
      <button className="ql-background" title="Background Color"><i className="fas fa-fill-drip"></i></button>
      <button className="ql-list" value="ordered" title="Ordered List"><i className="fas fa-list-ol"></i></button>
      <button className="ql-list" value="bullet" title="Bullet List"><i className="fas fa-list-ul"></i></button>
      <button className="ql-align" value="" title="Left"><i className="fas fa-align-left"></i></button>
      <button className="ql-align" value="center" title="Center"><i className="fas fa-align-center"></i></button>
      <button className="ql-align" value="right" title="Right"><i className="fas fa-align-right"></i></button>
      <button className="ql-align" value="justify" title="Justify"><i className="fas fa-align-justify"></i></button>
      <button className="ql-indent" value="-1" title="Decrease Indent"><i className="fas fa-outdent"></i></button>
      <button className="ql-indent" value="+1" title="Increase Indent"><i className="fas fa-indent"></i></button>
      <button className="ql-link" title="Insert Link"><i className="fas fa-link"></i></button>
      <button className="ql-image" title="Insert Image"><i className="fas fa-image"></i></button>
      <button className="ql-video" title="Insert Video"><i className="fas fa-video"></i></button>
      <button className="ql-table" title="Insert Table"><i className="fas fa-table"></i></button>
      <button className="ql-code-block" title="Code Block"><i className="fas fa-code"></i></button>

      <div className="relative inline-block">
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="text-xl"
          title="Insert Emoji"
        >
          😊
        </button>
        {showEmojiPicker && (
          <div className="absolute z-50 mt-2 bg-white shadow-lg rounded-lg" style={{ top: '100%', right: 0 }}>
            <EmojiPicker
              onEmojiClick={(emojiData) => {
                onEmojiClick(emojiData.emoji);
                setShowEmojiPicker(false);
              }}
              width="300px"
              height="400px"
            />
          </div>
        )}
      </div>

      <div className="relative inline-block">
        <button
          type="button"
          onClick={() => setShowColorPicker(!showColorPicker)}
          title="Custom Color"
        >
          <i className="fas fa-eyedropper"></i>
        </button>
        {showColorPicker && (
          <div className="absolute z-50 mt-2 bg-white shadow-lg rounded-lg p-2" style={{ top: '100%', right: 0 }}>
            <ChromePicker
              color="#000"
              onChangeComplete={(color) => {
                onColorChange(color.hex);
                setShowColorPicker(false);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

const modules = {
  toolbar: {
    container: '#toolbar',
  },
  clipboard: {
    matchVisual: false,
  },
};

const formats = [
  'font',
  'size',
  'bold',
  'italic',
  'underline',
  'strike',
  'color',
  'background',
  'list',
  'bullet',
  'indent',
  'align',
  'link',
  'image',
  'video',
  'table',
  'code-block',
];

const RichTextEditor = ({ value, onChange, placeholder, readOnly = false }) => {
  const quillRef = useRef(null);

  const handleEmojiClick = (emoji) => {
    const quill = quillRef.current?.getEditor();
    if (quill) {
      const range = quill.getSelection();
      quill.insertText(range?.index || 0, emoji);
    }
  };

  const handleColorChange = (color) => {
    const quill = quillRef.current?.getEditor();
    if (quill) {
      quill.format('color', color);
    }
  };

  return (
    <div className="relative w-full">
      <CustomToolbar onEmojiClick={handleEmojiClick} onColorChange={handleColorChange} />
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={readOnly}
        className="bg-white rounded-b-lg"
        style={{ minHeight: '300px' }}
      />
    </div>
  );
};

export default RichTextEditor;