from fpdf import FPDF

pdf = FPDF()
pdf.add_page()
pdf.set_font("Arial", size=12)
pdf.cell(200, 10, txt="Digifort Labs Optimization Test Document", ln=1, align='C')
pdf.multi_cell(0, 10, txt="This is a test document to verify the asynchronous PDF optimization engine.\n" * 20)
pdf.output("test_input.pdf")
print("test_input.pdf created.")
