

WITH_PROTOTYPE = ./build/html-template-with-prototype.js
WITH_NAMESPACE = ./build/html-template-with-namespace.js

CORE_SRC = ./src/html-template-core.js
WITH_NAMESPACE_SRC = ./src/html-template-with-namespace.js
WITH_PROTOTYPE_SRC = ./src/html-template-with-prototype.js
all: $(WITH_PROTOTYPE) $(WITH_NAMESPACE)

$(WITH_PROTOTYPE): $(WITH_PROTOTYPE_SRC) $(CORE_SRC)
	./bin/build $(WITH_PROTOTYPE_SRC) > $(WITH_PROTOTYPE)

$(WITH_NAMESPACE): $(WITH_NAMESPACE_SRC) $(CORE_SRC)
	./bin/build $(WITH_NAMESPACE_SRC) > $(WITH_NAMESPACE)

clean:
	rm -rf ./build/*


