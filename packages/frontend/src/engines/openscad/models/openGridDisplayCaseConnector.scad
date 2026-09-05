opengrid_snap = true;
connector_offset = 0.05;
corner_1 = true;
corner_2 = true;
corner_3 = true;
corner_4 = true;
corner_1_depth = 25;
corner_2_depth = 25;
corner_3_depth = 25;
corner_4_depth = 25;
connector_fillet = 0.2;

module openGridSnap () {
    $fn =50;
    module cutout() {
        union() {
            translate([0, 11.4, 3.1])
                cube([11.8, 0.6, 6.2], true);
            translate([-5.9, 11.4, 3.1])
                cylinder(6.2, 0.3, 0.3, true);
            translate([5.9, 11.4, 3.1])
                cylinder(6.2, 0.3, 0.3, true);
            translate([0, 12, 5.8])
                cube([12, 0.8, 0.4], true);
        }
    }
    
    module corner() {
        translate([0, 0, 5.3])
            polyhedron(
                [
                    [-3.406, 0, 0],
                    [-2.306, 1.1, 1.1],
                    [2.306, 1.1, 1.1],
                    [3.406, 0, 0],
                    [-3.406, 0, 1.5],
                    [-2.306, 1.1, 1.5],
                    [2.306, 1.1, 1.5],
                    [3.406, 0, 1.5]
                ], 
                [
                    [0,1,2,3],
                    [4,5,1,0],
                    [7,6,5,4],
                    [5,6,2,1],
                    [6,7,3,2],
                    [7,4,0,3]
                ]
            );
    }
    
    module snap() {
        translate([0, 12.4, 3.4])
            polyhedron(
                [
                    [-5.4, 0, 0],
                    [-3.4342, 0.4, 0.5715],
                    [3.4342, 0.4, 0.5715],
                    [5.4, 0, 0],
                    [-5.4, 0, 2],
                    [-3.4342, 0.4, 1.7145],
                    [3.4342, 0.4, 1.7145],
                    [5.4, 0, 2]
                ], 
                [
                    [0,1,2,3],
                    [4,5,1,0],
                    [7,6,5,4],
                    [5,6,2,1],
                    [6,7,3,2],
                    [7,4,0,3]
                ]
            );
    }
    
    union() {
        difference() {
            linear_extrude(6.8) {
                polygon(
                    [
                        [-7.582, -12.4],
                        [7.582, -12.4],
                        [12.4, -7.582],
                        [12.4, 7.582],
                        [7.582, 12.4],
                        [-7.582, 12.4],
                        [-12.4, 7.582],
                        [-12.4, -7.582]
                    ]
                );
            }
            
            cutout();
            rotate([0, 0, 90]) cutout();
            rotate([0, 0, 180]) cutout();
            rotate([0, 0, -90]) cutout();
        }
        
        translate([-9.991, 9.991, 0]) rotate([0, 0, 45]) corner();
        translate([-9.991, -9.991, 0]) rotate([0, 0, 135]) corner();
        translate([9.991, 9.991, 0]) rotate([0, 0, -45]) corner();
        translate([9.991, -9.991, 0]) rotate([0, 0, -135]) corner();
        
        snap();
        rotate([0, 0, 90]) snap();
        rotate([0, 0, 180]) snap();
        rotate([0, 0, -90]) snap();
    }
}

module connector(connector_depth) {
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

union() {
    if (opengrid_snap) {
        translate([0, 0, -6.80])
            openGridSnap();
    }

    if (corner_1) {
        connector(corner_1_depth);
    }
    if (corner_2) {
        rotate([0, 0, -90])
            connector(corner_2_depth);
    }
    if (corner_3) {
        rotate([0, 0, 180])
            connector(corner_3_depth);
    }
    if (corner_4) {
        rotate([0, 0, 90])
            connector(corner_4_depth);
    }
}