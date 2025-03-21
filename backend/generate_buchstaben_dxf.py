#!/usr/bin/env python3
import os
import string
import ezdxf
from fontTools.ttLib import TTFont
from fontTools.pens.basePen import BasePen
from ezdxf.path import Path
from ezdxf.path.converter import to_polylines2d
from ezdxf.math import Matrix44
import ezdxf.bbox as bbox

# Eigener Pen zum Erfassen der Pfade
class DXFPen(BasePen):
    def __init__(self, glyphSet):
        super().__init__(glyphSet)
        self.path = Path()

    def _moveTo(self, p0):
        self.path.move_to(p0)

    def _lineTo(self, p1):
        self.path.line_to(p1)

    def _curveToOne(self, p1, p2, p3):
        # Das ist ein Cubic Bézier (Curve4)
        self.path.curve4_to(p3, p1, p2)  # Reihenfolge: end, ctrl1, ctrl2

    def _qCurveToOne(self, p1, p2):
        # Das ist ein Quadratic Bézier (Curve3)
        self.path.curve3_to(p2, p1)  # Reihenfolge: end, ctrl
       
    def _closePath(self):
        self.path.close()


def create_letter_dxf(letter, target_folder, text_height=50, font_path="./Buchstaben/sf-florencesans-sc-exp.ttf"):
    # Font laden
    font = TTFont(font_path)
    glyph_set = font.getGlyphSet()
    cmap = font['cmap'].getBestCmap()
    glyph_name = cmap.get(ord(letter))

    if not glyph_name:
        print(f"Keine Glyphe gefunden für: {letter}")
        return

    glyph = glyph_set[glyph_name]
    pen = DXFPen(glyph_set)
    glyph.draw(pen)
    path = pen.path

    if len(path) == 0:
        print(f"Leerer Pfad für: {letter}")
        return

    # Skalieren und zentrieren
    bounds = path.bbox()
    min_x, min_y, _ = bounds.extmin
    max_x, max_y, _ = bounds.extmax
    scale = text_height / (max_y - min_y) if max_y != min_y else 1
    m = Matrix44.chain(
        Matrix44.scale(scale, scale, 1),
        Matrix44.translate(-min_x * scale, -min_y * scale, 0)
    )
    path = path.transform(m)


    # DXF erzeugen
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()



    # Sortiere die Pfade nach Größe: Der größte ist die Außenkontur
    sub_paths = sorted(path.sub_paths(), key=lambda p: p.bbox().size, reverse=True)

    # Die erste Kontur ist die Außenkontur
    outer_path = sub_paths[0]
    inner_paths = sub_paths[1:]  # Alle anderen sind Innenkonturen

    # Funktion zum Erzwingen geschlossener Pfade mit definiertem Start- und Endpunkt
    def close_path_with_explicit_points(path: Path):
        if path.start.distance(path.end) > 1e-6:  # Prüfe, ob Start- und Endpunkt übereinstimmen
            path.line_to(path.start)  # Explizit den Start- mit dem Endpunkt verbinden

    # Außenkontur zeichnen
    close_path_with_explicit_points(outer_path)  # Stelle sicher, dass die Außenkontur geschlossen ist
    for poly in to_polylines2d([outer_path]):
        poly.closed = True  # Außenkontur schließen
        msp.add_entity(poly)

    # Innenkonturen separat zeichnen, **jedes mit eigenem Startpunkt!**
    for inner_path in inner_paths:
        inner_path = inner_path.reversed()  # Innenkonturen umdrehen, damit sie korrekt sind
        close_path_with_explicit_points(inner_path)  # Stelle sicher, dass sie sauber geschlossen sind

        for poly in to_polylines2d([inner_path]):
            poly.closed = True  # Innenkonturen explizit schließen
            poly.dxf.layer = "InnerContours"  # Falls du Ebenen für bessere Übersicht willst
            msp.add_entity(poly)  # Innenkonturen separat hinzufügen

    # Speichern
    filename = f"{letter}.dxf"
    filepath = os.path.join(target_folder, filename)
    doc.saveas(filepath)
    print(f"Erstellt: {filepath}")

def main():
    target_folder = "./Buchstaben"
    os.makedirs(target_folder, exist_ok=True)

    letters = string.ascii_uppercase  # Nur Großbuchstaben A–Z
    for letter in letters:
        create_letter_dxf(letter, target_folder)

    # Breiten berechnen
    letter_widths = {}
    for letter in letters:
        filepath = os.path.join(target_folder, f"{letter}.dxf")
        try:
            doc = ezdxf.readfile(filepath)
            msp = doc.modelspace()
            min_pt, max_pt = bbox.extents(msp)
            width = max_pt[0] - min_pt[0]
            letter_widths[letter] = int(round(width))
        except Exception as e:
            print(f"Fehler bei {letter}: {e}")
            letter_widths[letter] = 0

    # Breiten als Textdatei speichern
    output_txt = os.path.join(target_folder, "letter_widths.txt")
    with open(output_txt, "w", encoding="utf8") as f:
        f.write(str(letter_widths))
    print(f"Buchstabenbreiten gespeichert unter: {output_txt}")

if __name__ == '__main__':
    main()
