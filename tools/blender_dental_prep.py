"""
DentalCare Pro - Script de Preparación de Mandíbula para GLB
Ejecutar en Blender (Scripting tab) para preparar el modelo dental.

INSTRUCCIONES:
1. Abre tu archivo de mandíbula en Blender
2. Ve a la pestaña "Scripting"
3. Pega este código y presiona "Run Script"
"""

import bpy
import bmesh

def prepare_dental_model():
    print("=" * 50)
    print("DentalCare Pro - Preparador de Modelos Dentales")
    print("=" * 50)
    
    # 1. Limpieza total: Eliminar cámaras, luces, curvas, mallas vacías
    objects_to_delete = []
    for obj in bpy.data.objects:
        if obj.type in ('CAMERA', 'LIGHT', 'EMPTY', 'CURVE', 'LATTICE', 'ARMATURE'):
            objects_to_delete.append(obj)
        elif obj.type == 'MESH':
            # Detectar mallas con 0 vértices (mallas vacías)
            if len(obj.data.vertices) == 0:
                objects_to_delete.append(obj)
    
    for obj in objects_to_delete:
        bpy.data.objects.remove(obj, do_unlink=True)
    print(f"✅ Objetos basura eliminados: {len(objects_to_delete)}")
    
    # 2. Seleccionar TODOS los objetos tipo malla
    bpy.ops.object.select_all(action='DESELECT')
    mesh_objects = [obj for obj in bpy.data.objects if obj.type == 'MESH']
    
    for obj in mesh_objects:
        obj.select_set(True)
    
    if len(mesh_objects) == 0:
        print("❌ ERROR: No se encontraron mallas en el archivo. Asegúrate de haber importado el modelo.")
        return
    
    print(f"📦 Mallas encontradas: {len(mesh_objects)}")
    
    # 3. Si es una sola malla, intentar separar por material o partes sueltas
    if len(mesh_objects) == 1:
        main_obj = mesh_objects[0]
        bpy.context.view_layer.objects.active = main_obj
        print(f"⚠️  El modelo es 1 sola malla. Intentando separar por partes sueltas...")
        
        # Separar piezas no conectadas (esto divide en dientes si están sueltos)
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.separate(type='LOOSE')
        bpy.ops.object.mode_set(mode='OBJECT')
        
        # Actualizar lista de mallas
        mesh_objects = [obj for obj in bpy.data.objects if obj.type == 'MESH']
        print(f"✅ Separación completada. Piezas ahora: {len(mesh_objects)}")
    
    # 4. Renombrar cada malla con numeración dental (FDI - Federación Dental Internacional)
    fdi_numbers = [
        18, 17, 16, 15, 14, 13, 12, 11,  # Superior derecha
        21, 22, 23, 24, 25, 26, 27, 28,  # Superior izquierda
        48, 47, 46, 45, 44, 43, 42, 41,  # Inferior derecha
        31, 32, 33, 34, 35, 36, 37, 38   # Inferior izquierda
    ]
    
    # Ordenar por posición X para asignar números lógicamente
    mesh_objects.sort(key=lambda obj: obj.location.x)
    
    for i, obj in enumerate(mesh_objects):
        if i < len(fdi_numbers):
            old_name = obj.name
            obj.name = str(fdi_numbers[i])
            obj.data.name = f"diente_{fdi_numbers[i]}_mesh"
            print(f"   🦷 {old_name} → Pieza #{fdi_numbers[i]}")
        else:
            # Si hay más piezas que números FDI, agregar con sufijo
            obj.name = f"pieza_extra_{i}"
            print(f"   ❓ Pieza extra: pieza_extra_{i}")
    
    # 5. Aplicar transformaciones (escala y rotación) a todos
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    print("✅ Transformaciones aplicadas (escala y rotación normalizadas)")
    
    # 6. Centrar cada pieza en su propio pivote
    for obj in mesh_objects:
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
        obj.select_set(False)
    print("✅ Pivotes centrados en geometría de cada pieza")
    
    # 7. Mover toda la colección al centro del mundo
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='MEDIAN')
    
    # Calcular centro de la colección y mover al origen
    from mathutils import Vector
    centers = [obj.location for obj in mesh_objects if obj.type == 'MESH']
    if centers:
        avg_location = sum(centers, Vector((0, 0, 0))) / len(centers)
        bpy.ops.transform.translate(value=-avg_location)
    
    print("✅ Modelo centrado en el origen del mundo (0,0,0)")
    
    # 8. Reporte final
    print()
    print("=" * 50)
    print("✅ PREPARACIÓN COMPLETADA")
    print(f"   Piezas dentales listas: {len(mesh_objects)}")
    print(f"   Nombres FDI asignados: Sí")
    print()
    print("SIGUIENTE PASO:")
    print("   1. Verifica visualmente que los dientes se ven bien")
    print("   2. Exporta como GLB: File > Export > glTF 2.0 (.glb/.gltf)")
    print("   3. En opciones de exportación:")
    print("      - Format: GLB (Binary)")
    print("      - Include: Geometry > Apply Modifiers: SÍ")
    print("      - Transform: Y Up: SÍ")
    print("   4. Guárdalo como: mandibula_test.glb.glb")
    print("   5. Cópialo a la carpeta 'public' del proyecto DentalCare Pro")
    print("=" * 50)

prepare_dental_model()
