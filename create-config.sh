#!/bin/bash

out=$2.tmp
buffer=$2.buffer
# Open array
echo "[" > $out
for file in $1/*.json
do
  # Skip config files
  if [[ $file != *"config"* ]];then
    #Create function to extract json properties
    _jq() {
      cat $file | jq -r ${1}
    }

    # Extract the props
    name=$(_jq '.name')
    factor=$(_jq '.factor')

    #create array entry
    echo "{\"name\":\"$name\",\"factor\":$factor}" >> $out
    echo "," >> $out
  fi
done

#remove trailing ,
head -n -1 $out > $buffer

#Close json array
echo "]" >> $buffer

#create actual file
cp  $buffer $2

# Remove buffers
rm -f $buffer $out