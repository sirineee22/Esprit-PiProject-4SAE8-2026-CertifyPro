import PyPDF2

try:
    with open(r'c:\Users\ammar\OneDrive\Desktop\PIDEV_grp4_vFinal_260305_032535.pdf', 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        text = ''
        for page in reader.pages:
            t = page.extract_text()
            if t:
                text += t + '\n'
        
        with open('pdf_content.txt', 'w', encoding='utf-8') as out:
            out.write(text)
    print('PDF extraction complete.')
except Exception as e:
    print('Error:', e)
