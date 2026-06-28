import os
from pypdf import PdfReader
import docx

def extract_text_from_pdf(file_path):
    """Extracts text from a PDF file using pypdf."""
    try:
        reader = PdfReader(file_path)
        text = ""
        for i, page in enumerate(reader.pages):
            page_text = page.extract_text()
            if page_text:
                text += f"\n--- Page {i+1} ---\n{page_text}"
        return text.strip()
    except Exception as e:
        raise ValueError(f"Error parsing PDF file: {str(e)}")

def extract_text_from_docx(file_path):
    """Extracts text from a DOCX file using python-docx."""
    try:
        doc = docx.Document(file_path)
        full_text = []
        for para in doc.paragraphs:
            full_text.append(para.text)
        return "\n".join(full_text).strip()
    except Exception as e:
        raise ValueError(f"Error parsing DOCX file: {str(e)}")

def extract_text_from_txt(file_path):
    """Extracts text from a plain text file."""
    try:
        # Try UTF-8 first
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read().strip()
    except UnicodeDecodeError:
        # Fallback to Latin-1
        try:
            with open(file_path, 'r', encoding='latin-1') as f:
                return f.read().strip()
        except Exception as e:
            raise ValueError(f"Error decoding text file: {str(e)}")
    except Exception as e:
        raise ValueError(f"Error reading text file: {str(e)}")

def extract_text(file_path, filename):
    """Dispatches to the correct extractor based on file extension."""
    ext = os.path.splitext(filename.lower())[1]
    
    if ext == '.pdf':
        return extract_text_from_pdf(file_path)
    elif ext == '.docx':
        return extract_text_from_docx(file_path)
    elif ext in ['.txt', '.md', '.json', '.csv']:
        return extract_text_from_txt(file_path)
    else:
        raise ValueError(f"Unsupported file format: {ext}. Only PDF, DOCX, and TXT are supported.")
