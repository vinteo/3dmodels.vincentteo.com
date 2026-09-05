dimension_mode = "grid"; // "grid" (28mm OpenGrid units) or "custom" (explicit mm)
grid_width = 6;
grid_height = 4;
custom_width = 168;
custom_height = 112;

width = (dimension_mode == "custom") ? custom_width : (grid_width * 28);
height = (dimension_mode == "custom") ? custom_height : (grid_height * 28);
base_thickness = 1;
arcylic_height = 100;
arcylic_width = 150;
arcylic_thickness = 1;
connector_offset = 0.05;
connector_depth = 8;
connector_fillet = 0.2;

$fn = 50;

module connector() {
    linear_extrude(connector_depth) {
        polygon(points = [[0,0], [6,0], [0,6]]);
    }
    translate([3, 3, 0])
        rotate([0, 0, -45])
        union() {
            translate([-0.5 + connector_offset, 0, 0])
                cube([1 - (connector_offset * 2), 2 - connector_offset, connector_depth]);
            linear_extrude(connector_depth) {
                translate([-1.5 + connector_offset + connector_fillet, 1 + connector_offset + connector_fillet, 0])
                    offset(connector_fillet) {
                        square([3 - (connector_offset * 2) - (connector_fillet * 2), 1 - (connector_offset * 2) - (connector_fillet * 2)]);
                    }
            }
        }
}

module corner_holder() {
    translate([0, 0, -0.45])
        linear_extrude(0.45) {
            polygon(points = [[0,0], [3,0], [0,3]]);
        }
}
    
// Shell
union() {
    difference() {
        translate([0, 0, (-base_thickness - arcylic_thickness - 0.5) / 2])
            cube([width, height, base_thickness + arcylic_thickness + 0.5], true);
        union() {
            translate([0, 0, (-arcylic_thickness - 0.5) / 2])
                cube([arcylic_width, arcylic_height, arcylic_thickness + 0.5], true);
            translate([0, 0, (-base_thickness / 2) - arcylic_thickness - 0.5])
                cube([arcylic_width - 2, arcylic_height - 2, base_thickness], true);
        }
    }

    translate([-width / 2, -height / 2, 0])
        connector();
    translate([width / 2, -height / 2, 0])
        rotate([0, 0, 90])
        connector();
    translate([-width / 2, height / 2, 0])
        rotate([0, 0, -90])
        connector();
    translate([width / 2, height / 2, 0])
        rotate([0, 0, 180])
        connector();
    
    translate([-arcylic_width / 2, -arcylic_height / 2, 0])
        corner_holder();
    translate([arcylic_width / 2, -arcylic_height / 2, 0])
        rotate([0, 0, 90])
        corner_holder();
    translate([-arcylic_width / 2, arcylic_height / 2, 0])
        rotate([0, 0, -90])
        corner_holder();
    translate([arcylic_width / 2, arcylic_height / 2, 0])
        rotate([0, 0, 180])
        corner_holder();
}   
