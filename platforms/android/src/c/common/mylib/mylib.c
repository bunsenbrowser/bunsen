//
//  mylib.c
//  Cross-platform C library
//

#include "mylib.h"
#include "mycomponent.h"
#include "mypart.h"
#include <stdlib.h>


int calculate(int y, int z) {
    return multiply(sum(y,z),z);
}
