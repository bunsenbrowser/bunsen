//
//  hello.c
//  Cross-platform C functionality
//

#include "hello.h"
#include <stdlib.h>
#include <string.h>

char* concat(const char* s1, const char* s2){
    char* result = malloc(strlen(s1)+strlen(s2)+1);//+1 for the zero-terminator
    strcpy(result, s1);
    strcat(result, s2);
    return result;
}

char* c_hello(char* input) {
    char* hello= "I'm a cross-platform pure C function. You sent me this: ";
    char* result = concat(hello, input);
    return result;
}

