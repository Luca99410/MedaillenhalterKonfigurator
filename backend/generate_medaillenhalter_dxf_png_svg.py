#!/usr/bin/env python3
import os
import math
import string
import ezdxf
from ezdxf.document import Drawing  # statt ezdxf.DXFDoc
from ezdxf.addons.importer import Importer
from ezdxf.addons.drawing import Frontend, RenderContext, pymupdf, svg, layout, config
from ezdxf.math import Matrix44

def import_file_as_block(file_path: str, block_name: str, target_doc: Drawing) -> None:
    # Falls der Block bereits existiert, tue nichts:
    if block_name in target_doc.blocks:
        return
    try:
        source = ezdxf.readfile(file_path)
    except (IOError, ezdxf.DXFStructureError) as e:
        print(f"Fehler beim Lesen von {file_path}: {e}")
        return
    target_block = target_doc.blocks.new(name=block_name)
    importer_instance = Importer(source, target_doc)
    importer_instance.import_entities(source.modelspace(), target_layout=target_block)
    importer_instance.finalize()

def export_to_png(doc: Drawing, output_png: str) -> None:
    context = RenderContext(doc)
    backend = pymupdf.PyMuPdfBackend()
    cfg = config.Configuration(
        background_policy=config.BackgroundPolicy.OFF,
        color_policy=config.ColorPolicy.BLACK,
        hatch_policy=config.HatchPolicy.IGNORE,
    )
    frontend = Frontend(context, backend, config=cfg)
    msp = doc.modelspace()
    frontend.draw_layout(msp)
    page = layout.Page(0, 0, layout.Units.mm, margins=layout.Margins.all(2))
    png_bytes = backend.get_pixmap_bytes(page, fmt="png", dpi=96)
    with open(output_png, "wb") as fp:
        fp.write(png_bytes)
    print(f"PNG export saved as: {output_png}")

def export_to_svg(doc: Drawing, output_svg: str) -> None:
    context = RenderContext(doc)
    backend = svg.SVGBackend()
    cfg = config.Configuration(
        background_policy=config.BackgroundPolicy.WHITE,
        color_policy=config.ColorPolicy.BLACK,
    )
    frontend = Frontend(context, backend, config=cfg)
    msp = doc.modelspace()
    frontend.draw_layout(msp)
    page = layout.Page(0, 0, layout.Units.mm, margins=layout.Margins.all(2))
    svg_string = backend.get_string(page)
    with open(output_svg, "wt", encoding="utf8") as fp:
        fp.write(svg_string)
    print(f"SVG export saved as: {output_svg}")

def insert_and_mirror(filename, offset, msp, target, vorlagen_ordner):
    filepath = os.path.join(vorlagen_ordner, filename)
    block_name = os.path.splitext(os.path.basename(filepath))[0]
    print(f"Importiere '{filepath}' als Block '{block_name}' mit Offset {offset} ...")
    import_file_as_block(filepath, block_name, target)
    # Füge die originale Blockreferenz ein:
    msp.add_blockref(block_name, insert=offset)
    # Füge die gespiegelte Kopie ein:
    mirrored_insert = (offset[0], offset[1])
    mirrored_ref = msp.add_blockref(block_name, insert=mirrored_insert)
    mirrored_ref.transform(Matrix44.scale(-1, 1, 1))

def verlaengerungslinien_einfuegen(anzahl_ebenen, vorlage_offsets, verlaengerung, msp, target):
    if anzahl_ebenen < 1:
        return
    for i in range(0, len(vorlage_offsets) - 1):
        for y in range(0, anzahl_ebenen * 2 * 20, 20):
            startpunkt = vorlage_offsets[i + 1][0]
            endpunkt = vorlage_offsets[i + 1][0] + (verlaengerung / 2)
            msp.add_line((startpunkt, y), (endpunkt, y))
            msp.add_line(((-1) * startpunkt, y), (((-1) * endpunkt), y))

def get_width_of_medaillenhalter(text, user_breite=0, bild_abstand=5, bild_leerzeichen=20):
    import os
    # Lade das Dictionary aus der Textdatei:
    dict_path = os.path.join("Buchstaben", "letter_widths.txt")
    with open(dict_path, "r", encoding="utf8") as f:
        letter_widths = eval(f.read())
    
    # Errechne die Breite für jeden Character:
    widths = []
    for char in text:
        if char.isspace():
            # Bei Leerzeichen: benutze bild_leerzeichen als Breite
            widths.append(bild_leerzeichen)
        else:
            # Andernfalls: Konvertiere in Großbuchstaben und
            # verwende den Wert aus dem Dictionary, falls vorhanden
            letter = char.upper()
            if "A" <= letter <= "Z":
                widths.append(letter_widths.get(letter, 0))
            else:
                # Nicht-Alphabetische Zeichen überspringen:
                continue

    # Füge zusätzlich den Zwischenabstand (bild_abstand) zwischen den Elementen hinzu:
    if widths:
        bild_width = sum(widths) + (len(widths) - 1) * bild_abstand
    else:
        bild_width = 0

    # Berechne eine eventuelle Verlängerung, falls bild_width > 180 ist:

    rohwert = bild_width - 180 if bild_width > 180 else 0
    verlaengung = math.ceil(rohwert / 10) * 10 if rohwert > 0 else 0    # Gesamte Breite berechnen (hier als Beispiel: 20+90+100 plus Verlängerung)
    gesamtbreite = 20 + 90 + 100 + verlaengung
    mindestbreite = gesamtbreite

    if user_breite > gesamtbreite:
        gesamtbreite = user_breite
        rohwert = user_breite - (20 + 90 + 100)
        verlaengung = math.ceil(rohwert / 10) * 10 if rohwert > 0 else 0    # Gesamte Breite berechnen (hier als Beispiel: 20+90+100 plus Verlängerung)

        rohwert = bild_width - 180 if bild_width > 180 else 0
        mindest_verlaengung = math.ceil(rohwert / 10) * 10 if rohwert > 0 else 0    # Gesamte Breite berechnen (hier als Beispiel: 20+90+100 plus Verlängerung)
        mindestbreite = 20 + 90 + 100 + mindest_verlaengung

    return gesamtbreite, bild_width, verlaengung, letter_widths, mindestbreite


def get_medaillenhalter(benennung_nach_konfiguration = False, zielordner = "Warenkorb", id = "id_test_for_cycling_leerzeichen", design = "Radfahren", text = "radfahren ist gesund", anzahl_ebenen = 3, user_breite=0):
    vorlagen_ordner = "./dxf_vorlagen"
    design_name = str(design) + ".dxf"

    if benennung_nach_konfiguration:
        id = str(text) + "_" + str(design) + "_" + str(anzahl_ebenen)
    output_dxf = os.path.join(f"{zielordner}", "DXF", f"{id}.dxf")
    output_png = os.path.join(f"{zielordner}", "PNG", f"{id}.png")
    output_svg = os.path.join(f"{zielordner}", "SVG", f"{id}.svg")

    vorlage_dateien = [f"{anzahl_ebenen}_{i}.dxf" for i in [1, 2, 3]]
    bild_abstand = 5
    bild_leerzeichen = 40
    
    target = ezdxf.new("R2010")
    msp = target.modelspace()
    
    # Definiere individuelle Offsets für die übrigen Vorlage_dateien
    vorlage_offsets = [
        (0, 0),     # Für 5_1.dxf
        (-20, 0),   # Für 5_2.dxf
        (-110, 0)   # Für 5_3.dxf
    ]

    gesamtbreite, bild_width, verlaengung, letter_widths, _ = get_width_of_medaillenhalter(
    text,
    user_breite=user_breite,
    bild_abstand=bild_abstand,
    bild_leerzeichen=bild_leerzeichen
    )

    if verlaengung > 9:
        vorlage_offsets[1] = (vorlage_offsets[1][0] - verlaengung / 4, 0)
        vorlage_offsets[2] = (vorlage_offsets[2][0] - verlaengung / 2, 0)
        verlaengerungslinien_einfuegen(anzahl_ebenen, vorlage_offsets, verlaengung/2, msp, target)

    
    design_offset = (vorlage_offsets[2][0] - 40, 0)
    
    for filename, offset in zip(vorlage_dateien, vorlage_offsets):
        insert_and_mirror(filename, offset, msp, target, vorlagen_ordner)
    
    
    insert_and_mirror(design_name, design_offset, msp, target, vorlagen_ordner)
    
    # ROTATION UM 180°: Alle Entitäten im Modelspace drehen
    rot_matrix = Matrix44.z_rotate(math.radians(180))
    for entity in msp:
        entity.transform(rot_matrix)
    
    x_start = - bild_width / 2

    for char in text:
        if char == " ":
            # Bei Leerzeichen einfach den Abstand hinzufügen und mit dem nächsten Zeichen fortfahren
            print("Leerzeichen gefunden")
            x_start += bild_leerzeichen
            continue

        # Konvertiere den Buchstaben in Großbuchstaben
        letter = char.upper()
        # Stelle sicher, dass der Buchstabe zwischen A und Z liegt
        if letter < "A" or letter > "Z":
            continue  # überspringe alle nicht-alphabetischen Zeichen

        letter_file = os.path.join("Buchstaben", f"{letter}.dxf")
        import_file_as_block(letter_file, letter, target)
        msp.add_blockref(letter, insert=(x_start, 0))
        x_start += letter_widths.get(letter, 0)
        x_start += bild_abstand


    print("Gesamtbreite:", gesamtbreite)
    target.saveas(output_dxf)
    print(f"Zusammengeführte DXF-Datei wurde gespeichert: {output_dxf}")
    
    export_to_png(target, output_png)
    export_to_svg(target, output_svg)

if __name__ == '__main__':
    get_medaillenhalter()
