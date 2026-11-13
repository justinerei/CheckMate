from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor
from pathlib import Path

out = Path('output/pdf/checkmate-quiz-draft-v2.pdf')
out.parent.mkdir(parents=True, exist_ok=True)
c = canvas.Canvas(str(out), pagesize=A4)
w, h = A4
left, right = 43, w - 43

def text(x, y, value, size=10, font='Helvetica', color='#171717'):
    c.setFillColor(HexColor(color)); c.setFont(font, size); c.drawString(x, y, value)

def line(x1, y1, x2, y2, color='#777777', width=.5):
    c.setStrokeColor(HexColor(color)); c.setLineWidth(width); c.line(x1, y1, x2, y2)

c.setFillColor(HexColor('#171717')); c.setFont('Helvetica-Bold', 17)
c.drawCentredString(w / 2, 798, 'SCIENCE QUIZ')
c.setFillColor(HexColor('#555555')); c.setFont('Helvetica', 9)
c.drawCentredString(w / 2, 782, 'Sample printable layout')
line(left, 772, right, 772, '#222222', .8)
text(left, 749, 'Name:', 10, 'Helvetica-Bold'); line(78, 746, 294, 746)
text(318, 749, 'Date:', 10, 'Helvetica-Bold'); line(347, 746, right, 746)
text(left, 726, 'Section:', 10, 'Helvetica-Bold'); line(87, 723, 294, 723)

def section(y, title, instruction):
    text(left, y, title, 10, 'Helvetica-Bold')
    text(left, y-15, instruction, 9)

section(692, 'I. MULTIPLE CHOICE', 'Encircle the letter of the correct answer. (1 point each)')
text(left, 652, '1. Which planet is known as the Red Planet?')
text(left+15, 634, 'A. Earth'); text(160, 634, 'B. Mars'); text(277, 634, 'C. Venus'); text(389, 634, 'D. Jupiter')
text(left, 604, '2. Which is a star?'); text(305, 604, '3. Which is a gas?')
text(left+15, 586, 'A. Sun      B. Moon'); text(320, 586, 'A. Oxygen    B. Iron')
text(left+15, 570, 'C. Earth    D. Mars'); text(320, 570, 'C. Wood      D. Salt')

section(537, 'II. TRUE OR FALSE', 'Write T if the statement is true and F if it is false. (1 point each)')
line(left, 495, left+38, 495); text(left+46, 498, '1. The Earth revolves around the Sun.')
line(left, 470, left+38, 470); text(left+46, 473, '2. The Moon is a planet.')

section(437, 'III. IDENTIFICATION', 'Write the correct answer on the blank. (2 points each)')
line(left, 395, left+115, 395); text(left+123, 398, '1. The process by which plants make food.')
line(left, 370, left+115, 370); text(left+123, 373, '2. The closest star to Earth.')

section(337, 'IV. ESSAY', 'Answer clearly using the lines provided. (5 points)')
text(left, 297, '1. Explain one way plants help people and the environment.')
for y in [270, 247, 224, 201, 178, 155, 132]: line(left, y, right, y, '#777777', .5)
c.save()
