dimension_mode = "grid"; // "grid" (28mm OpenGrid units) or "custom" (explicit mm)
grid_width = 6;
grid_height = 4;
custom_width = 168;
custom_height = 112;

width = (dimension_mode == "custom") ? custom_width : (grid_width * 28);
height = (dimension_mode == "custom") ? custom_height : (grid_height * 28);
depth = 32;
wall_thickness = 5;
back_thickness = 1;
connector_offset = 0.1;

module connector_cutoff() {
    union() {
        translate([-0.5 - connector_offset, 0, 0 - back_thickness - (depth / 2)])
            cube([1 + (connector_offset * 2), 2 + connector_offset, depth + back_thickness]);
        translate([-1.5 - connector_offset, 1 - connector_offset, 0 - back_thickness - (depth / 2)])
            cube([3 + (connector_offset * 2), 1 + (connector_offset * 2), depth + back_thickness]);
    }
}

difference() {
    union() {
        // Shell
        difference() {
            cube([width, height, depth], true);
            cube([width - (wall_thickness * 2), height - (wall_thickness * 2), depth], true);
        }

        // Back Wall
        translate([0, 0, 0 - (back_thickness / 2) - (depth / 2)])
            cube([width, height, back_thickness], true);
    }
    
    // Corners
    translate([0 - (width / 2), 0 - (height / 2), 0 - back_thickness - (depth / 2)])
    linear_extrude(depth + back_thickness) {
        polygon(points = [[0,0], [6,0], [0,6]]);
    }
    
    translate([0 + (width / 2), 0 - (height / 2), 0 - back_thickness - (depth / 2)])
    linear_extrude(depth + back_thickness) {
        polygon(points = [[0,0], [-6,0], [0,6]]);
    }
    
    translate([0 + (width / 2), 0 + (height / 2), 0 - back_thickness - (depth / 2)])
    linear_extrude(depth + back_thickness) {
        polygon(points = [[0,0], [-6,0], [0,-6]]);
    }
    
    translate([0 - (width / 2), 0 + (height / 2), 0 - back_thickness - (depth / 2)])
    linear_extrude(depth + back_thickness) {
        polygon(points = [[0,0], [6,0], [0,-6]]);
    }
    
    translate([(-width / 2) + 3, (height / 2) - 3, 0])
    rotate([0, 0, -135])
        connector_cutoff();
        
    translate([(-width / 2) + 3, (-height / 2) + 3, 0])
    rotate([0, 0, -45])
        connector_cutoff();
    
    translate([(width / 2) - 3, (-height / 2) + 3, 0])
    rotate([0, 0, 45])
        connector_cutoff();
    
    translate([(width / 2) - 3, (height / 2) - 3, 0])
    rotate([0, 0, 135])
        connector_cutoff();
}
