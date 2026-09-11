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

// Horizontal Dividers
h_divider_count = 0;
h_divider_thickness = 3;
h_divider_1_pos = 0;
h_divider_1_depth = 32;
h_divider_2_pos = 0;
h_divider_2_depth = 32;
h_divider_3_pos = 0;
h_divider_3_depth = 32;
h_divider_4_pos = 0;
h_divider_4_depth = 32;
h_divider_5_pos = 0;
h_divider_5_depth = 32;

// Vertical Dividers
v_divider_count = 0;
v_divider_thickness = 3;
v_divider_1_pos = 0;
v_divider_1_depth = 32;
v_divider_2_pos = 0;
v_divider_2_depth = 32;
v_divider_3_pos = 0;
v_divider_3_depth = 32;
v_divider_4_pos = 0;
v_divider_4_depth = 32;
v_divider_5_pos = 0;
v_divider_5_depth = 32;

module connector_cutoff() {
    union() {
        translate([-0.5 - connector_offset, 0, 0 - back_thickness - (depth / 2)])
            cube([1 + (connector_offset * 2), 2 + connector_offset, depth + back_thickness]);
        translate([-1.5 - connector_offset, 1 - connector_offset, 0 - back_thickness - (depth / 2)])
            cube([3 + (connector_offset * 2), 1 + (connector_offset * 2), depth + back_thickness]);
    }
}

function get_h_divider_pos(idx, count, inner_h) =
    (idx == 1 && h_divider_1_pos > 0) ? h_divider_1_pos :
    (idx == 2 && h_divider_2_pos > 0) ? h_divider_2_pos :
    (idx == 3 && h_divider_3_pos > 0) ? h_divider_3_pos :
    (idx == 4 && h_divider_4_pos > 0) ? h_divider_4_pos :
    (idx == 5 && h_divider_5_pos > 0) ? h_divider_5_pos :
    (idx * inner_h / (count + 1));

function get_v_divider_pos(idx, count, inner_w) =
    (idx == 1 && v_divider_1_pos > 0) ? v_divider_1_pos :
    (idx == 2 && v_divider_2_pos > 0) ? v_divider_2_pos :
    (idx == 3 && v_divider_3_pos > 0) ? v_divider_3_pos :
    (idx == 4 && v_divider_4_pos > 0) ? v_divider_4_pos :
    (idx == 5 && v_divider_5_pos > 0) ? v_divider_5_pos :
    (idx * inner_w / (count + 1));

function get_h_divider_depth(idx) =
    min(depth,
        (idx == 1 && h_divider_1_depth > 0) ? h_divider_1_depth :
        (idx == 2 && h_divider_2_depth > 0) ? h_divider_2_depth :
        (idx == 3 && h_divider_3_depth > 0) ? h_divider_3_depth :
        (idx == 4 && h_divider_4_depth > 0) ? h_divider_4_depth :
        (idx == 5 && h_divider_5_depth > 0) ? h_divider_5_depth :
        depth
    );

function get_v_divider_depth(idx) =
    min(depth,
        (idx == 1 && v_divider_1_depth > 0) ? v_divider_1_depth :
        (idx == 2 && v_divider_2_depth > 0) ? v_divider_2_depth :
        (idx == 3 && v_divider_3_depth > 0) ? v_divider_3_depth :
        (idx == 4 && v_divider_4_depth > 0) ? v_divider_4_depth :
        (idx == 5 && v_divider_5_depth > 0) ? v_divider_5_depth :
        depth
    );

module horizontal_dividers() {
    inner_w = width - (wall_thickness * 2);
    inner_h = height - (wall_thickness * 2);
    
    if (h_divider_count > 0) {
        for (i = [1 : h_divider_count]) {
            pos_y = get_h_divider_pos(i, h_divider_count, inner_h);
            actual_depth = get_h_divider_depth(i);
            y_coord = (-inner_h / 2) + pos_y;
            z_coord = (-depth / 2) + (actual_depth / 2);
            
            translate([0, y_coord, z_coord])
                cube([inner_w + 0.2, h_divider_thickness, actual_depth], true);
        }
    }
}

module vertical_dividers() {
    inner_w = width - (wall_thickness * 2);
    inner_h = height - (wall_thickness * 2);
    
    if (v_divider_count > 0) {
        for (i = [1 : v_divider_count]) {
            pos_x = get_v_divider_pos(i, v_divider_count, inner_w);
            actual_depth = get_v_divider_depth(i);
            x_coord = (-inner_w / 2) + pos_x;
            z_coord = (-depth / 2) + (actual_depth / 2);
            
            translate([x_coord, 0, z_coord])
                cube([v_divider_thickness, inner_h + 0.2, actual_depth], true);
        }
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

        // Internal Dividers
        horizontal_dividers();
        vertical_dividers();
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
